package com.dailyonemovie.dailyonemovie_backend.DTO;

import java.util.List;

public record CompleteMultipartRequest(
        String uploadId,
        String fileKey,
        List<CompletedPartDto> parts
) {}
