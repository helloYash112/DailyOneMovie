package com.dailyonemovie.dailyonemovie_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

@Configuration
public class AsyncExecutorConfig {

    @Bean(name = "movieUploadExecutor")
    public ThreadPoolTaskExecutor movieUploadExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // Optimized for Non-Blocking Async I/O: 
        // Since Netty handles the actual network transfer, this pool only manages 
        // the FFmpeg log listener and tasks scheduling the uploads.
        int CPU_CORES = Runtime.getRuntime().availableProcessors();
        executor.setCorePoolSize(CPU_CORES * 2); 
        executor.setMaxPoolSize(CPU_CORES * 4);

        // Lowered queue size: Triggers backpressure faster so local disk space 
        // doesn't fill up with hundreds of untransferred .ts files
        executor.setQueueCapacity(100);

        executor.setThreadNamePrefix("movie-upload-");

        // Essential: Keeps the pipeline stable under immense load
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // Graceful shutdown parameters
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(120);

        executor.initialize();
        return executor;
    }
}