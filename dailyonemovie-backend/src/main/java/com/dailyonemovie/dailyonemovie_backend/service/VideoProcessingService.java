package com.dailyonemovie.dailyonemovie_backend.service;

import java.io.File;
import java.nio.file.Path;
import java.util.function.Consumer;

public interface VideoProcessingService {
    String convertAndUploadHls(File inputFile, Long movieId, Consumer<Integer> progressCallback) throws Exception;
}
