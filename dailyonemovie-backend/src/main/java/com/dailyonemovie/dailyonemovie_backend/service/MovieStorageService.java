package com.dailyonemovie.dailyonemovie_backend.service;

import java.io.File;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.dailyonemovie.dailyonemovie_backend.DTO.CompletedPartDto;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitResponse;
import com.dailyonemovie.dailyonemovie_backend.DTO.PartUrlInfo;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
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
	@Value("${b2.bucketName}")
	private String bucketName;

	// Inject beans from B2Config
	public MovieStorageService(S3Client s3Client, S3Presigner s3Presigner) {
		this.s3Client = s3Client;
		this.s3Presigner = s3Presigner;
	}

	/** Upload movie or poster */
	public void uploadFile(String key, MultipartFile multipartFile, String contentType) {

		File tempFile = null;

		try {

// Create temp file
			tempFile = File.createTempFile("upload-", ".tmp");

// Copy multipart content to temp file
			multipartFile.transferTo(tempFile);

			PutObjectRequest putRequest = PutObjectRequest.builder().bucket(bucketName).key(key)
					.contentType(contentType).build();

// Upload using file
			s3Client.putObject(putRequest, RequestBody.fromFile(tempFile));

			System.out.println("UPLOAD SUCCESS");

		} catch (Exception e) {

			e.printStackTrace();
			throw new RuntimeException(e);

		} finally {

// Delete temp file
			if (tempFile != null && tempFile.exists()) {
				tempFile.delete();
			}
		}
	}

	/** Generate pre-signed URL (valid for 9 hours) */
	public String generatePresignedUrl(String key,Duration expirey) {
		GetObjectRequest getObjectRequest = GetObjectRequest.builder().bucket(bucketName).key(key).build();

		GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
				.signatureDuration(expirey).getObjectRequest(getObjectRequest).build();

		PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
		return presignedRequest.url().toString();
	}

	/** Delete movie or poster */
	public void deleteFile(String key) {
    try {
        // Log exactly what is being sent to find hidden space issues
        System.out.println("Attempting to delete key: [" + key + "]");

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key) 
                .build();

        s3Client.deleteObject(deleteRequest);
        
        // S3 is idempotent, so we manually check if it worked
        System.out.println("Delete request processed by S3.");
        
    } catch (S3Exception e) {
        System.err.println("AWS S3 Error: " + e.awsErrorDetails().errorMessage());
    }
}
	
	/** generating presigned upload metthod to drect upload from ui  */
	public String generateUploadUrl(String key,String type){
		PutObjectRequest putRequest =PutObjectRequest.builder().bucket(bucketName).key(key).contentType(type).build();
		PutObjectPresignRequest preSigned=PutObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(45)).putObjectRequest(putRequest).build();
		PresignedPutObjectRequest presignedReq=s3Presigner.presignPutObject(preSigned);
		return presignedReq.url().toString();
	}
	    public List<String> listFiles() {
        ListObjectsV2Response response = s3Client.listObjectsV2(ListObjectsV2Request.builder()
                .bucket(bucketName)
                .build());

        return response.contents().stream()
                .map(S3Object::key)
                .collect(Collectors.toList());
    }

	public MultipartInitResponse initiateMultipartUpload(String fileName, int totalParts) {
        String fileKey = "large-uploads/" + UUID.randomUUID() + "_" + fileName;

        // 1. Ask S3 to start a multipart transaction
        CreateMultipartUploadRequest createRequest = CreateMultipartUploadRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();
        
        CreateMultipartUploadResponse createResponse = s3Client.createMultipartUpload(createRequest);
        String uploadId = createResponse.uploadId();

        // 2. Generate a presigned URL for every chunk/part
        List<PartUrlInfo> partUrls = new ArrayList<>();
        for (int partNumber = 1; partNumber <= totalParts; partNumber++) {
            
            UploadPartRequest uploadPartRequest = UploadPartRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build();

            UploadPartPresignRequest presignRequest = UploadPartPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(45))
                    .uploadPartRequest(uploadPartRequest)
                    .build();

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
            .map(p -> CompletedPart.builder()
                    .partNumber(p.partNumber()) // Using record getter syntax
                    .eTag(p.eTag())
                    .build())
            // 2. CRITICAL: Sort by part number ascending so AWS S3 doesn't reject it
            .sorted((p1, p2) -> Integer.compare(p1.partNumber(), p2.partNumber()))
            .collect(Collectors.toList());
    System.out.println("implementiong  CompletedMultipartUpload req...");
    CompletedMultipartUpload completedMultipartUpload = CompletedMultipartUpload.builder()
            .parts(parts)
            .build();
    System.out.println("implementing CompleteMultipartUploadRequest....");
    CompleteMultipartUploadRequest completeRequest = CompleteMultipartUploadRequest.builder()
            .bucket(bucketName)
            .key(fileKey)
            .uploadId(uploadId)
            .multipartUpload(completedMultipartUpload)
            .build();
    System.out.println("sending marge req....");
    s3Client.completeMultipartUpload(completeRequest);
    System.out.println("marger req is sucessfull...");
}
}
