package com.dailyonemovie.dailyonemovie_backend.DTO;

import java.util.List;

public record MultipartInitResponse(
    String uploadId,
    String fileKey,
    List<PartUrlInfo> partUrls
) {
  
    
}
