package com.dailyonemovie.dailyonemovie_backend.DTO;

public record HlsDTO(
		Long id,
	    String title,
	    String genre,
	    int duration,
	    double rating,
	    String posterKey, 
	    String posterUrl,     
	    String playlistKey,
	    String playlistUrl) {
    

}
