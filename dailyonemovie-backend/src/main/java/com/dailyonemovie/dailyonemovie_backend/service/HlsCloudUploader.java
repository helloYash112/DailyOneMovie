import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.dailyonemovie.dailyonemovie_backend.config.R2StorageProperties;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.BiConsumer;

public class HlsCloudUploader {

    private static final Logger log = LoggerFactory.getLogger(HlsCloudUploader.class);
    private static final int THREAD_POOL_SIZE = 10;
    
    private final S3Client s3Client;
    private R2StorageProperties r2StorageProperties;

    /**
     * Constructor injecting pre-configured S3/R2 client.
     */
    public HlsCloudUploader(S3Client s3Client, R2StorageProperties r2StorageProperties) {
        this.s3Client = s3Client;
        this.r2StorageProperties = r2StorageProperties;
    }

    /**
     * Main entry function to orchestrate the HLS upload pipeline.
     *
     * @param uploadId        Database identifier for tracking the upload state.
     * @param m3u8FilePathStr Absolute local path to the primary .m3u8 manifest file.
     * @param progressTracker Callback function persisting progress: (uploadId, percentage).
     */
    public void uploadHlsFolder(String uploadId, String m3u8FilePathStr, BiConsumer<String, Integer> progressTracker) {
        log.info("Starting HLS upload process for Upload ID: {}. Manifest: {}", uploadId, m3u8FilePathStr);

        Path m3u8Path = Paths.get(m3u8FilePathStr);
        Path baseDirectory = m3u8Path.getParent();

        if (baseDirectory == null || !Files.exists(m3u8Path)) {
            throw new IllegalArgumentException("Invalid manifest path or directory structure.");
        }

        // 1. Synchronously parse manifest to discover all segment files
        List<String> tsSegments = extractSegmentsFromManifest(m3u8Path);
        int totalFiles = tsSegments.size() + 1; // +1 includes the .m3u8 manifest file itself
        log.info("Discovered {} TS segments to upload for ID: {}", tsSegments.size(), uploadId);

        // 2. Initialize fixed thread pool and synchronization barriers
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        Phaser phaser = new Phaser(1); // Register main thread
        AtomicInteger completedFiles = new AtomicInteger(0);
        List<Throwable> exceptions = new CopyOnWriteArrayList<>();

        try {
            // 3. Concurrently queue all TS segment uploads
            for (String segmentName : tsSegments) {
                Path segmentPath = baseDirectory.resolve(segmentName);
                String s3Key = "hls/" + uploadId + "/" + segmentName;

                phaser.register();
                executor.submit(() -> {
                    try {
                        uploadFileToCloud(segmentPath, s3Key);
                        updateProgress(uploadId, completedFiles.incrementAndGet(), totalFiles, progressTracker);
                    } catch (Exception e) {
                        log.error("Failed to upload segment: {} due to: {}", segmentName, e.getMessage());
                        exceptions.add(e);
                    } finally {
                        phaser.arriveAndDeregister();
                    }
                });
            }

            // 4. Concurrently queue the actual .m3u8 manifest file
            String manifestS3Key = "hls/" + uploadId + "/" + m3u8Path.getFileName().toString();
            phaser.register();
            executor.submit(() -> {
                try {
                    uploadFileToCloud(m3u8Path, manifestS3Key);
                    updateProgress(uploadId, completedFiles.incrementAndGet(), totalFiles, progressTracker);
                } catch (Exception e) {
                    log.error("Failed to upload manifest file due to: {}", e.getMessage());
                    exceptions.add(e);
                } finally {
                    phaser.arriveAndDeregister();
                }
            });

            // Wait for all concurrent tasks to reach arrival phase
            phaser.arriveAndAwaitAdvance();

            // 5. Audit exceptions post-execution
            if (!exceptions.isEmpty()) {
                throw new RuntimeException("HLS Upload failed with " + exceptions.size() + " errors. Check logs.");
            }

            log.info("HLS Stream upload successfully completed for Upload ID: {}", uploadId);

        } finally {
            // Orderly shutdown of thread pool resources
            executor.shutdown();
            try {
                if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                    executor.shutdownNow();
                }
            } catch (InterruptedException ie) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Helper: Synchronously parses an m3u8 file to extract segment filenames (.ts).
     */
    private List<String> extractSegmentsFromManifest(Path m3u8Path) {
        List<String> segments = new ArrayList<>();
        try (BufferedReader reader = Files.newBufferedReader(m3u8Path)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // HLS spec defines segment lines as non-comment lines following #EXTINF
                if (!line.isEmpty() && !line.startsWith("#")) {
                    segments.add(line);
                }
            }
        } catch (IOException e) {
            log.error("Critical I/O error reading manifest file: {}", m3u8Path, e);
            throw new CompletionException(e);
        }
        return segments;
    }

    /**
     * Helper: Reusable cloud upload operation mapping directly to S3/R2 endpoints.
     */
    private void uploadFileToCloud(Path localFilePath, String s3Key) {
        if (!Files.exists(localFilePath)) {
            throw new IllegalArgumentException("Target source file does not exist: " + localFilePath);
        }

        log.debug("Uploading {} to S3 key: {}", localFilePath.getFileName(), s3Key);
        
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(r2StorageProperties.getBucket())
                    .key(s3Key)
                    .contentType(s3Key.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T")
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromFile(localFilePath));
            
        } catch (S3Exception e) {
            log.error("Cloud Provider rejected upload for key: {}. Error: {}", s3Key, e.awsErrorDetails().errorMessage());
            throw e;
        }
    }

    /**
     * Helper: Thread-safe calculation and distribution of progress states to the DB tracker.
     */
    private void updateProgress(String uploadId, int completed, int total, BiConsumer<String, Integer> progressTracker) {
        int percentage = (int) (((double) completed / total) * 100);
        log.info("Upload ID: {} Progress: {}% ({}/{})", uploadId, percentage, completed, total);
        if (progressTracker != null) {
            try {
                progressTracker.accept(uploadId, percentage);
            } catch (Exception e) {
                log.warn("Database progress tracking callback failed for ID: {}. Error: {}", uploadId, e.getMessage());
            }
        }
    }
}