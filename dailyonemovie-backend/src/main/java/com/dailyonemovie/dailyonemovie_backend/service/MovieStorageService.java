package com.dailyonemovie.dailyonemovie_backend.service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionService;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorCompletionService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.dailyonemovie.dailyonemovie_backend.DTO.CompletedPartDto;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitResponse;
import com.dailyonemovie.dailyonemovie_backend.DTO.PartUrlInfo;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.async.AsyncRequestBody;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.UploadPartPresignRequest;

@Service
public class MovieStorageService {

	private final S3Client s3Client;
	private final S3Presigner s3Presigner;
	private final S3AsyncClient s3AsyncClient;
	private final ExecutorService uploadExecutor = Executors.newFixedThreadPool(12);
	@Value("${b2.bucketName}")
	private String bucketName;

	// Inject beans from B2Config
	public MovieStorageService(S3Client s3Client, S3Presigner s3Presigner, S3AsyncClient s3AsyncClient) {
		this.s3Client = s3Client;
		this.s3Presigner = s3Presigner;
		this.s3AsyncClient = s3AsyncClient;
	}

	/** Delete movie or poster */
	public void deleteFile(String key) {
		try {
			// Log exactly what is being sent to find hidden space issues
			System.out.println("Attempting to delete key: [" + key + "]");

			DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder().bucket(bucketName).key(key).build();

			s3Client.deleteObject(deleteRequest);

			// S3 is idempotent, so we manually check if it worked
			System.out.println("Delete request processed by S3.");

		} catch (S3Exception e) {
			System.err.println("AWS S3 Error: " + e.awsErrorDetails().errorMessage());
		}
	}

	/** generating presigned upload metthod to drect upload from ui */
	public String generateUploadUrl(String key, String type) {
		PutObjectRequest putRequest = PutObjectRequest.builder().bucket(bucketName).key(key).contentType(type).build();
		PutObjectPresignRequest preSigned = PutObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(45))
				.putObjectRequest(putRequest).build();
		PresignedPutObjectRequest presignedReq = s3Presigner.presignPutObject(preSigned);
		return presignedReq.url().toString();
	}

	public List<String> listFiles() {
		ListObjectsV2Response response = s3Client
				.listObjectsV2(ListObjectsV2Request.builder().bucket(bucketName).build());

		return response.contents().stream().map(S3Object::key).collect(Collectors.toList());
	}

	public MultipartInitResponse initiateMultipartUpload(String fileName, int totalParts) {
		String fileKey = "large-uploads/" + UUID.randomUUID() + "_" + fileName;

		// 1. Ask S3 to start a multipart transaction
		CreateMultipartUploadRequest createRequest = CreateMultipartUploadRequest.builder().bucket(bucketName)
				.key(fileKey).build();

		CreateMultipartUploadResponse createResponse = s3Client.createMultipartUpload(createRequest);
		String uploadId = createResponse.uploadId();

		// 2. Generate a presigned URL for every chunk/part
		List<PartUrlInfo> partUrls = new ArrayList<>();
		for (int partNumber = 1; partNumber <= totalParts; partNumber++) {

			UploadPartRequest uploadPartRequest = UploadPartRequest.builder().bucket(bucketName).key(fileKey)
					.uploadId(uploadId).partNumber(partNumber).build();

			UploadPartPresignRequest presignRequest = UploadPartPresignRequest.builder()
					.signatureDuration(Duration.ofMinutes(45)).uploadPartRequest(uploadPartRequest).build();

			String presignedUrl = s3Presigner.presignUploadPart(presignRequest).url().toString();
			partUrls.add(new PartUrlInfo(partNumber, presignedUrl));
		}

		return new MultipartInitResponse(uploadId, fileKey, partUrls);
	}

	public void completeMultipartUpload(String fileKey, String uploadId, List<CompletedPartDto> completedParts) {
		System.out.println("i am in MovieStorage class ...");
		System.out.println("fetching completedpart from list...");

		List<CompletedPart> parts = completedParts.stream()
				// 1. Map your record to the SDK's CompletedPart
				.map(p -> CompletedPart.builder().partNumber(p.partNumber()) // Using record getter syntax
						.eTag(p.eTag()).build())
				// 2. CRITICAL: Sort by part number ascending so AWS S3 doesn't reject it
				.sorted((p1, p2) -> Integer.compare(p1.partNumber(), p2.partNumber())).collect(Collectors.toList());
		System.out.println("implementiong  CompletedMultipartUpload req...");
		CompletedMultipartUpload completedMultipartUpload = CompletedMultipartUpload.builder().parts(parts).build();
		System.out.println("implementing CompleteMultipartUploadRequest....");
		CompleteMultipartUploadRequest completeRequest = CompleteMultipartUploadRequest.builder().bucket(bucketName)
				.key(fileKey).uploadId(uploadId).multipartUpload(completedMultipartUpload).build();
		System.out.println("sending marge req....");
		s3Client.completeMultipartUpload(completeRequest);
		System.out.println("marger req is sucessfull...");
	}

	public void uploadFile(String key, MultipartFile file, String contentType) throws IOException {
		s3Client.putObject(PutObjectRequest.builder().bucket(bucketName).key(key).contentType(contentType).build(),
				RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
	}

	public String generatePresignedUrl(String key, Duration expiry) {
		GetObjectRequest getObjectRequest = GetObjectRequest.builder().bucket(bucketName).key(key).build();
		GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder().signatureDuration(expiry)
				.getObjectRequest(getObjectRequest).build();
		PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
		return presignedRequest.url().toString();
	}

	// ✅ Fetch manifest and normalize lines
	public String getOriginalManifest(String manifestKey) {
		GetObjectRequest getReq = GetObjectRequest.builder().bucket(bucketName).key(manifestKey).build();

		try (ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(getReq);
				BufferedReader reader = new BufferedReader(new InputStreamReader(s3Object))) {

			return reader.lines().map(line -> line.replace("\r", "").trim()) // normalize CRLF + spaces
					.collect(Collectors.joining("\n"));

		} catch (IOException e) {
			throw new RuntimeException("Error reading manifest", e);
		}
	}

	// ✅ Build presigned URL map for all .ts files

	public Map<String, String> getPresignedUrlsForSegments(String prefix) {
		Map<String, String> urls = new HashMap<>();
		String continuationToken = null;

		do {
			ListObjectsV2Request.Builder reqBuilder = ListObjectsV2Request.builder().bucket(bucketName).prefix(prefix);

			if (continuationToken != null) {
				reqBuilder.continuationToken(continuationToken);
			}

			ListObjectsV2Response response = s3Client.listObjectsV2(reqBuilder.build());

			for (S3Object obj : response.contents()) {
				if (!obj.key().endsWith(".ts"))
					continue;

				String fileName = obj.key().substring(obj.key().lastIndexOf("/") + 1).replace("\r", "").trim();

				PresignedGetObjectRequest signed = s3Presigner.presignGetObject(
						p -> p.getObjectRequest(GetObjectRequest.builder().bucket(bucketName).key(obj.key()).build())
								.signatureDuration(Duration.ofHours(6)));

				urls.put(fileName, signed.url().toString());
			}

			continuationToken = response.nextContinuationToken();
		} while (continuationToken != null);

		return urls;
	}

	public String buildPresignedManifest(String manifestKey, String prefix) {
	    // 1. Get the raw clean text layout of your m3u8 file
	    String manifest = getOriginalManifest(manifestKey);
	    StringBuilder rewritten = new StringBuilder();

	    // Ensure our prefix string ends cleanly with a slash
	    String pathPrefix = (prefix.endsWith("/")) ? prefix : prefix + "/";

	    // 2. Process the file line-by-line
	    for (String line : manifest.split("\n")) {
	        String normalized = line.replace("\r", "").trim();

	        if (normalized.endsWith(".ts")) {
	            // Reconstruct the exact full path key for this specific segment file inside the bucket
	            String fullSegmentKey = pathPrefix + normalized;

	            try {
	                // 3. Directly generate the presigned URL for this specific file on the fly
	                PresignedGetObjectRequest signed = s3Presigner.presignGetObject(p -> p
	                        .getObjectRequest(GetObjectRequest.builder()
	                                .bucket(bucketName)
	                                .key(fullSegmentKey)
	                                .build())
	                        .signatureDuration(Duration.ofHours(6))
	                );

	                rewritten.append(signed.url().toString()).append("\n");

	            } catch (Exception e) {
	                throw new RuntimeException("Failed to presign segment key target: " + fullSegmentKey, e);
	            }
	        } else {
	            rewritten.append(normalized).append("\n");
	        }
	    }

	    return rewritten.toString();
	}

	// ------------------------------------------------------------------------------------
	
}
