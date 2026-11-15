package com.dailyonemovie.dailyonemovie_backend.service;

import java.io.File;
import java.nio.file.Path;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

public interface VideoProcessingService {
    String convertAndUploadHls(File inputFile, Long movieId, Consumer<Integer> progressCallback) throws Exception;
    public void uploadHlsFolder(String uploadId, String m3u8FilePathStr, BiConsumer<String, Integer> progressTracker);
}
