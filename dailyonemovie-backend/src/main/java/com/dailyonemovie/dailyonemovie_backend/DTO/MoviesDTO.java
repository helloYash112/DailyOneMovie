package com.dailyonemovie.dailyonemovie_backend.DTO;

public record MoviesDTO(
	    Long id,
	    String title,
	    String genre,
	    int duration,
	    double rating,
	    String movieKey,
	    String posterKey,
	    String movieUrl,
	    String posterUrl
	) {}