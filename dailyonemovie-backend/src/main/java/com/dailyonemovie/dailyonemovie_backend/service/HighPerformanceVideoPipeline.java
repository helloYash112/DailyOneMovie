package com.dailyonemovie.dailyonemovie_backend.service;


import software.amazon.awssdk.transfer.s3.S3TransferManager;
import software.amazon.awssdk.transfer.s3.model.UploadFileRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.dailyonemovie.dailyonemovie_backend.config.R2StorageProperties;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
public class HighPerformanceVideoPipeline implements VideoProcessingService{

    private static final Logger log = LoggerFactory.getLogger(HighPerformanceVideoPipeline.class);
    private static final Pattern DURATION_PATTERN = Pattern.compile("Duration:\\s*(\\d+):(\\d+):(\\d+)\\.(\\d+)");

    private final S3TransferManager transferManager;
    private final String bucket;
    private final Executor uploadExecutor;

    public HighPerformanceVideoPipeline(
            S3TransferManager transferManager,
            @Qualifier("movieUploadExecutor") Executor uploadExecutor,
            R2StorageProperties storageProperties) {
        this.transferManager = transferManager;
        this.uploadExecutor = uploadExecutor;
        this.bucket =storageProperties.getBucket();
    }
@Override
    public String convertAndUploadHls(
            File inputFile,
            Long movieId,
            Consumer<Integer> progressConsumer) throws Exception {

        if (inputFile == null || !inputFile.exists()) {
            throw new IllegalArgumentException("Input video file does not exist.");
        }

        final long totalInputSize = inputFile.length();
        final Path tempDir = Files.createTempDirectory("hls_pipeline_" + movieId + "_");
        final String baseUploadPath = "hls/" + movieId + "/";
        final String playlistKey = baseUploadPath + "playlist.m3u8";

        // Thread-safe tracking engines
        final Set<String> activeUploads = ConcurrentHashMap.newKeySet();
        final AtomicLong totalBytesUploaded = new AtomicLong(0);
        
        // Use a phaser or bounded coordinator to track deep async jobs structurally
        final Phaser taskCoordinator = new Phaser(1); 

        // 1. Pre-calculate precise video duration via FFprobe/FFmpeg to establish accurate metric baselines
        double durationInSeconds = estimateVideoDuration(inputFile);

        log.info("Starting production processing pipeline for Movie: {} | Size: {} MB | Target Duration: {}s", 
                movieId, totalInputSize / (1024 * 1024), durationInSeconds);

        Process ffmpeg = null;
        try {
            ffmpeg = startFfmpeg(inputFile, tempDir);

            // 2. Spawn a specialized non-blocking reader thread
            final Process processRef = ffmpeg;
            CompletableFuture<Void> pipelineMonitor = CompletableFuture.runAsync(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(processRef.getInputStream(), StandardCharsets.UTF_8))) {
                    
                    String line;
                    while ((line = reader.readLine()) != null) {
                        // React directly to HLS segment opening/closing notices in stdout log streams
                        if (line.contains("Opening") && line.contains(".ts")) {
                            triggerAsyncSegmentUploads(tempDir, baseUploadPath, activeUploads, totalBytesUploaded, totalInputSize, progressConsumer, taskCoordinator);
                        }
                    }
                } catch (Exception e) {
                    throw new CompletionException("Fatal breakdown inside process stream reader thread", e);
                }
            }, uploadExecutor);

            // 3. Wait for compiler transcoding sequence safely
            int exitCode = ffmpeg.waitFor();
            if (exitCode != 0) {
                throw new IllegalStateException("FFmpeg processing engine terminated anomalously with exit code: " + exitCode);
            }

            // Ensure our stream consumer terminates or surfaces its exceptions gracefully
            pipelineMonitor.join();

            // 4. Force synchronization of all pending parallel tasks before executing final sweeps
            taskCoordinator.arriveAndAwaitAdvance();

            // 5. Run final sweep upload for the master layout manifest configuration
            uploadRemainingFiles(tempDir, baseUploadPath);

            if (progressConsumer != null) {
                progressConsumer.accept(100);
            }

        } catch (Exception pipelineException) {
            log.error("Critical Failure inside HLS processing pipeline architecture for movie context ID: {}", movieId, pipelineException);
            throw new RuntimeException("Video Processing Pipeline Exception", pipelineException);
        } finally {
            // Destructive lifecycle safety guarantees
            if (ffmpeg != null && ffmpeg.isAlive()) {
                ffmpeg.destroyForcibly();
            }
            cleanupDisk(tempDir);
        }

        return playlistKey;
    }

    private Process startFfmpeg(File inputFile, Path outputDir) throws Exception {
        String segmentPattern = outputDir.resolve("seg_%06d.ts").toString();
        String playlistPath = outputDir.resolve("playlist.m3u8").toString();

        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg", "-y",
                "-i", inputFile.getAbsolutePath(),
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-tune", "zerolatency",
                "-sc_threshold", "0", 
                "-c:a", "aac",
                "-b:a", "128k",
                "-f", "hls",
                "-hls_time", "6", // Increased slightly to maximize Cloudflare multi-part chunking efficiency
                "-hls_list_size", "0",
                "-hls_flags", "independent_segments",
                "-hls_segment_filename", segmentPattern,
                playlistPath
        );

        pb.redirectErrorStream(true);
        return pb.start();
    }

    private void triggerAsyncSegmentUploads(Path tempDir, String baseUploadPath, Set<String> activeUploads, 
                                             AtomicLong totalBytesUploaded, long totalInputSize, 
                                             Consumer<Integer> progressConsumer, Phaser phaser) {
        try (Stream<Path> files = Files.list(tempDir)) {
            files.filter(p -> p.toString().endsWith(".ts"))
                 .forEach(file -> {
                     String fileName = file.getFileName().toString();
                     
                     // Concurrency gate: ensure we only register the file for upload once
                     if (activeUploads.add(fileName)) {
                         phaser.register();
                         
                         uploadExecutor.execute(() -> {
                             try {
                                 long fileSize = Files.size(file);
                                 String s3Key = baseUploadPath + fileName;

                                 uploadFileToR2(file, s3Key, "video/MP2T");
                                 
                                 // Safely delete immediately after successful upload
                                 Files.deleteIfExists(file);

                                 // Update overall progress based on physical bytes processed
                                 long currentUploadedBytes = totalBytesUploaded.addAndGet(fileSize);
                                 if (progressConsumer != null && totalInputSize > 0) {
                                     int computedProgress = (int) ((currentUploadedBytes * 95) / totalInputSize);
                                     progressConsumer.accept(Math.min(99, computedProgress));
                                 }
                             } catch (Exception e) {
                                 log.error("Asynchronous processing failure for segment chunk target: {}", fileName, e);
                                 activeUploads.remove(fileName); // Evict key to support targeted recovery sweeps
                             } finally {
                                 phaser.arriveAndDeregister();
                             }
                         });
                     }
                 });
        } catch (Exception e) {
            log.error("Error evaluating local scratch workspace directories", e);
        }
    }

    private void uploadRemainingFiles(Path tempDir, String baseUploadPath) {
        try (Stream<Path> walk = Files.list(tempDir)) {
            walk.forEach(file -> {
                try {
                    String fileName = file.getFileName().toString();
                    String contentType = fileName.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
                    uploadFileToR2(file, baseUploadPath + fileName, contentType);
                    Files.deleteIfExists(file);
                } catch (Exception e) {
                    log.error("Fatal exception encountered on final directory sweep processing", e);
                }
            });
        } catch (Exception e) {
            log.error("Directory traversal error during final execution sweep step", e);
        }
    }

    private void uploadFileToR2(Path file, String s3Key, String contentType) {
        if (!Files.exists(file)) return;

        UploadFileRequest request = UploadFileRequest.builder()
                .putObjectRequest(p -> p
                        .bucket(bucket)
                        .key(s3Key)
                        .contentType(contentType))
                .source(file)
                .build();

        // AWS CRT Engine automatically divides execution into multi-part transfers if needed
        transferManager.uploadFile(request).completionFuture().join();
    }

    private double estimateVideoDuration(File inputFile) {
        try {
            ProcessBuilder pb = new ProcessBuilder("ffmpeg", "-i", inputFile.getAbsolutePath());
            pb.redirectErrorStream(true);
            Process p = pb.start();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) {
                    Matcher m = DURATION_PATTERN.matcher(line);
                    if (m.find()) {
                        long hours = Long.parseLong(m.group(1));
                        long minutes = Long.parseLong(m.group(2));
                        long seconds = Long.parseLong(m.group(3));
                        return hours * 3600 + minutes * 60 + seconds;
                    }
                }
            }
        } catch (Exception ignored) {}
        return 1.0; // Graceful structural fallback to avoid division by zero exceptions
    }

    private void cleanupDisk(Path dir) {
        if (dir == null || !Files.exists(dir)) return;
        try (Stream<Path> s = Files.walk(dir)) {
            s.sorted(Comparator.reverseOrder()).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (Exception ignored) {}
            });
            log.info("Disk cleanup completely successful.");
        } catch (Exception e) {
            log.error("Failed to purge temporary runtime directories cleanly: {}", dir, e);
        }
    }
}
