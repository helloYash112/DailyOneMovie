package com.dailyonemovie.dailyonemovie_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.dailyonemovie.dailyonemovie_backend.entity.Movies;

import jakarta.transaction.Transactional;

@Repository
public interface MovieRepository extends JpaRepository<Movies, Long> {
	@Transactional
	@Modifying
	@Query("UPDATE Movies m SET m.progress = :progress WHERE m.id = :id")
	void updateMovieProgress(@Param("id") Long id, @Param("progress") int progress);

	@Transactional
	@Modifying
	@Query("UPDATE Movies m SET m.status = :status WHERE m.id = :id")
	void updateFinalStatus(@Param("id") Long id, @Param("status") String status);

}
