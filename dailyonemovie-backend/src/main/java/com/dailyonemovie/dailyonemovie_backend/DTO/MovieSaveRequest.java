package com.dailyonemovie.dailyonemovie_backend.DTO;

import com.dailyonemovie.dailyonemovie_backend.entity.HlsMetadata;
import com.dailyonemovie.dailyonemovie_backend.entity.Movies;

public record MovieSaveRequest(
	    String title,
	    String genre,
	    int duration,
	    double rating,
	    String movieKey,
	    String posterKey,
	    String playlistKey,
	    String chunkKeysJson
	) {
	    public Movies toMovieEntity() {
	        Movies m = new Movies();
	        m.setTitle(title);
	        m.setGenre(genre);
	        m.setDuration(duration);
	        m.setRating(rating);
	        m.setMovieKey(movieKey);
	        m.setPosterKey(posterKey);
	        return m;
	    }

	    public HlsMetadata toHlsEntity() {
	        HlsMetadata h = new HlsMetadata();
	        h.setPlaylistKey(playlistKey);
	        h.setChunkKeysJson(chunkKeysJson);
	        return h;
	    }
	}
