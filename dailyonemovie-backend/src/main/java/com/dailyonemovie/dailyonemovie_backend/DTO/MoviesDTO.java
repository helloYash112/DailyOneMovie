package com.dailyonemovie.dailyonemovie_backend.DTO;

public record MoviesDTO(
	    Long id,
	    String title,
	    String genre,
	    int duration,
	    double rating,
	    String posterKey,      // stable key for poster in storage
	    String posterUrl,      // presigned GET URL for poster
	    String playlistKey,    // stable key for HLS playlist (hls/{movieId}/playlist.m3u8)
	    String playlistUrl     // presigned GET URL for playlist.m3u8
	) {}
