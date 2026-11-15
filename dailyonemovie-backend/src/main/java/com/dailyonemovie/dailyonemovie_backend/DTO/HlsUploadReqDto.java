package com.dailyonemovie.dailyonemovie_backend.DTO;

import org.springframework.web.multipart.MultipartFile;

public record HlsUploadReqDto(String title,
	    String genre,
	    int duration,
	    double rating,
	    String manifestPath,
	    MultipartFile posterFile) {

}
