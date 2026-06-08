package com.dailyonemovie.dailyonemovie_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.dailyonemovie.dailyonemovie_backend.entity.HlsMetadata;
import com.dailyonemovie.dailyonemovie_backend.entity.Movies;

public interface HlsMetadataRepository extends JpaRepository<HlsMetadata, Long> {
	 // Derived method (already works)
    Optional<HlsMetadata> findByMovie(Movies movie);

    // Custom JPQL query by Movie object
    @Query("SELECT h FROM HlsMetadata h WHERE h.movie = :movie")
    Optional<HlsMetadata> findByMovieObject(@Param("movie") Movies movie);

}
