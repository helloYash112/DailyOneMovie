package com.dailyonemovie.dailyonemovie_backend.config;

import java.net.URI;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;


import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.http.async.SdkAsyncHttpClient;
import software.amazon.awssdk.http.nio.netty.NettyNioAsyncHttpClient;

@Configuration
public class B2Config {

    @Value("${b2.endpoint}")
    private String endpoint;

    @Value("${b2.accessKeyId}")
    private String accessKeyId;

    @Value("${b2.secretAccessKey}")
    private String secretAccessKey;

    @Bean
    public S3Client s3Client() {

        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("us-east-005"))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        accessKeyId,
                                        secretAccessKey)))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {

        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("us-east-005"))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        accessKeyId,
                                        secretAccessKey)))
                .build();
    }
    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        executor.initialize();
        return executor;
    }
    
 // Production initialization sample for Backblaze B2 S3-Compatible Storage compatibility

    
    @Bean
    public S3AsyncClient s3AsyncClient() {
        
        // Performance-tuned Netty HTTP/2 Client for dynamic parallel chunk uploads
        SdkAsyncHttpClient httpClient = NettyNioAsyncHttpClient.builder()
                .maxConcurrency(200) // Increased to allow high-density parallel segment transfers
                .maxPendingConnectionAcquires(5000)
                .writeTimeout(Duration.ofMinutes(5)) // Reduced from 10m; fail-fast is better for small segments
                .readTimeout(Duration.ofMinutes(5))
                .connectionTimeout(Duration.ofSeconds(10))
                .connectionMaxIdleTime(Duration.ofSeconds(60)) // Reclaim dead connection channels out of pool
                .build();

        return S3AsyncClient.builder()
                .httpClient(httpClient)
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                        )
                )
                // CRITICAL FIX: B2 requires a valid AWS standard region format (e.g., us-west-2) 
                // for signature signing calculation, regardless of the custom endpoint domain.
                .region(Region.US_WEST_2) 
                .endpointOverride(URI.create(endpoint))
                // Forces the SDK to use path-style URLs (bucket names in path rather than subdomain)
                // which prevents DNS resolution errors with certain B2 cluster regions.
                .forcePathStyle(true) 
                .build();
    }
}