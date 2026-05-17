package com.dailyonemovie.dailyonemovie_backend.service;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.dailyonemovie.dailyonemovie_backend.DTO.CompletedPartDto;
import com.dailyonemovie.dailyonemovie_backend.DTO.MoviesDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitResponse;
import com.dailyonemovie.dailyonemovie_backend.entity.Movies;
import com.dailyonemovie.dailyonemovie_backend.repository.MovieRepository;

@Service
public class MoviesService {

	private final MovieRepository moviesRepository;
	private final MovieStorageService storageService;

	public MoviesService(MovieRepository moviesRepository, MovieStorageService storageService) {
		this.moviesRepository = moviesRepository;
		this.storageService = storageService;
	}

	/** Save metadata + upload files */
	@Transactional
	public MoviesDTO saveMovie(Movies movie, MultipartFile movieFile, MultipartFile posterFile) {

		// Upload movie
		storageService.uploadFile(movie.getMovieKey(), movieFile, movieFile.getContentType());

		// Upload poster
		storageService.uploadFile(movie.getPosterKey(), posterFile, posterFile.getContentType());

		// Save metadata in DB
		Movies movies = moviesRepository.save(movie);
		return new MoviesDTO(movies.getId(), movies.getTitle(), movies.getGenre(), movies.getDuration(),
				movies.getRating(), movies.getMovieKey(), movies.getPosterKey(),
				storageService.generatePresignedUrl(movies.getMovieKey(), Duration.ofHours(9)),
				storageService.generatePresignedUrl(movies.getPosterKey(), Duration.ofHours(9)));
	}

	/** Get movie metadata */
	public Optional<Movies> getMovie(Long id) {
		return moviesRepository.findById(id);
	}

	/** Generate streaming URL for movie */
	public String getMovieStreamUrl(Long id) {
		Movies movie = moviesRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));
		return storageService.generatePresignedUrl(movie.getMovieKey(), Duration.ofHours(9));
	}

	/** Generate streaming URL for poster */
	public String getPosterUrl(Long id) {
		Movies movie = moviesRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));
		return storageService.generatePresignedUrl(movie.getPosterKey(), Duration.ofHours(9));
	}

	/** Delete movie (DB + Backblaze) */
	@Transactional
	public void deleteMovie(Long id) {
		Movies movie = moviesRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));

		// Delete from Backblaze
		storageService.deleteFile(movie.getMovieKey());
		storageService.deleteFile(movie.getPosterKey());

		// Delete from DB
		moviesRepository.delete(movie);
	}

	public List<MoviesDTO> fetchMovies() {
		List<Movies> movies = moviesRepository.findAll();

		if (movies == null || movies.isEmpty()) {
			return List.of();
		}

		return movies.stream().map(movie -> {
			String movieUrl = null;
			String posterUrl = null;

			if (movie.getMovieKey() != null) {
				movieUrl = storageService.generatePresignedUrl(movie.getMovieKey(), Duration.ofHours(9));
			}

			if (movie.getPosterKey() != null) {
				posterUrl = storageService.generatePresignedUrl(movie.getPosterKey(), Duration.ofHours(9));
			}

			return new MoviesDTO(movie.getId(), movie.getTitle(), movie.getGenre(), movie.getDuration(),
					movie.getRating(), movie.getMovieKey(), movie.getPosterKey(), movieUrl, posterUrl);
		}).toList();
	}

	public String getUploadUrl(String key, String fileType) {
		return storageService.generateUploadUrl(key, fileType);
	}

	public MoviesDTO saveAndReturnMovie(Movies movie) {

		Movies movies = moviesRepository.save(movie);
		return new MoviesDTO(movies.getId(), movies.getTitle(), movies.getGenre(), movies.getDuration(),
				movies.getRating(), movies.getMovieKey(), movies.getPosterKey(),
				storageService.generatePresignedUrl(movies.getMovieKey(), Duration.ofHours(9)),
				storageService.generatePresignedUrl(movies.getPosterKey(), Duration.ofHours(9)));

	}
	public List<String> getListOfFileFromCloud(){
		return storageService.listFiles();
	}

    public MultipartInitResponse initiateMultipartUploadService(String fileName, int totalParts) {
        return storageService.initiateMultipartUpload(fileName, totalParts);
    }

	public void completeMultipartUploadService(String fileKey, String uploadId, List<CompletedPartDto> completedParts) {
		System.out.println("i am in movie service class and calling movie storage service class method....");
		
     storageService.completeMultipartUpload(fileKey, uploadId, completedParts);
	
	}

}
