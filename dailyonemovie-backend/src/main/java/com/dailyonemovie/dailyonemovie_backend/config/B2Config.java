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
    /*
    @Bean
    public S3AsyncClient s3AsyncClient() {
        return S3AsyncClient.builder()
        		.region(Region.of("us-east-005"))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                    )
                )
                .endpointOverride(
                    URI.create(endpoint)
                )
                .build();
    }*/
    @Bean
    public S3AsyncClient s3AsyncClient() {

        SdkAsyncHttpClient httpClient =
                NettyNioAsyncHttpClient.builder()
                        .maxConcurrency(20)
                        .maxPendingConnectionAcquires(1000)
                        .writeTimeout(Duration.ofMinutes(10))
                        .readTimeout(Duration.ofMinutes(10))
                        .connectionTimeout(Duration.ofSeconds(30))
                        .build();

        return S3AsyncClient.builder()
                .httpClient(httpClient)
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(
                                        accessKeyId,
                                        secretAccessKey
                                )
                        )
                )
                .region(Region.of("us-east-005"))
                .endpointOverride(
                        URI.create(endpoint)
                )
                .build();
    }

}