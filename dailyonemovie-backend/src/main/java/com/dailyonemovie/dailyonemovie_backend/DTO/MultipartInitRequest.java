package com.dailyonemovie.dailyonemovie_backend.DTO;

public record MultipartInitRequest(
    String fileName,
    int totalParts
) {
    
}
