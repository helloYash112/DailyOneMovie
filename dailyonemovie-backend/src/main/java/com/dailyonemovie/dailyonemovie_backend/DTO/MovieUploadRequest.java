package com.dailyonemovie.dailyonemovie_backend.DTO;

import org.springframework.web.multipart.MultipartFile;

public record MovieUploadRequest(
    String title,
    String genre,
    int duration,
    double rating,
    MultipartFile movieFile,
    MultipartFile posterFile
) {}