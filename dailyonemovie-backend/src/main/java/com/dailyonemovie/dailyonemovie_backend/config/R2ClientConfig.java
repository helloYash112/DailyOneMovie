package com.dailyonemovie.dailyonemovie_backend.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.async.SdkAsyncHttpClient;
import software.amazon.awssdk.http.nio.netty.NettyNioAsyncHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.transfer.s3.S3TransferManager;

import java.net.URI;
import java.time.Duration;

@Configuration
public class R2ClientConfig {

    private final R2StorageProperties properties;

    public R2ClientConfig(R2StorageProperties properties) {
        this.properties = properties;
    }

    @Bean
    public StaticCredentialsProvider credentialsProvider() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                properties.getAccessKey(),
                properties.getSecretKey());
        return StaticCredentialsProvider.create(credentials);
    }

    @Bean
    public SdkAsyncHttpClient sdkAsyncHttpClient() {
        return NettyNioAsyncHttpClient.builder()
                .maxConcurrency(300)
                .maxPendingConnectionAcquires(10000)
                .connectionTimeout(Duration.ofSeconds(10))
                .readTimeout(Duration.ofMinutes(2))  // Reduced from 5m to catch dead pipes quicker
                .writeTimeout(Duration.ofMinutes(2)) // Reduced from 5m to catch dead pipes quicker
                .connectionMaxIdleTime(Duration.ofSeconds(30))
                .build();
    }

    /**
     * Shared S3 service configuration optimized specifically for Cloudflare R2 compatibility.
     */
    private S3Configuration getR2ServiceConfiguration() {
        return S3Configuration.builder()
                .pathStyleAccessEnabled(true)
                .checksumValidationEnabled(false) // CRITICAL: Disables heavy AWS checksums
                .chunkedEncodingEnabled(false)    // CRITICAL: Disables trailing payloads that stall R2
                .build();
    }

    @Bean
    public S3Client s3Client(StaticCredentialsProvider provider) {
        return S3Client.builder()
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(provider)
                .serviceConfiguration(getR2ServiceConfiguration())
                .build();
    }

    @Bean
    public S3AsyncClient s3AsyncClient(StaticCredentialsProvider provider, SdkAsyncHttpClient httpClient) {
        return S3AsyncClient.builder()
                .httpClient(httpClient)
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(provider)
                // 1. Keep this line: it passes pathStyle, checksum, and chunked encoding flags safely
                .serviceConfiguration(getR2ServiceConfiguration()) 
                // 2. REMOVE THIS LINE: .forcePathStyle(true) <--- DELETE OR COMMENT THIS OUT
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(StaticCredentialsProvider provider) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(provider)
                .build();
    }
    @Bean
    public S3TransferManager s3TransferManager(S3AsyncClient s3AsyncClient) {

        return S3TransferManager.builder()
                .s3Client(s3AsyncClient)
                .build();
    }
}
