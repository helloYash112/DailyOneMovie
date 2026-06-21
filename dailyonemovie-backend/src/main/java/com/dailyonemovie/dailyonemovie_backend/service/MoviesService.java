package com.dailyonemovie.dailyonemovie_backend.service;

import java.io.File;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.dailyonemovie.dailyonemovie_backend.DTO.CompletedPartDto;
import com.dailyonemovie.dailyonemovie_backend.DTO.HlsDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MovieStatusDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MovieUploadRequest;
import com.dailyonemovie.dailyonemovie_backend.DTO.MoviesDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitResponse;
import com.dailyonemovie.dailyonemovie_backend.entity.HlsMetadata;
import com.dailyonemovie.dailyonemovie_backend.entity.Movies;
import com.dailyonemovie.dailyonemovie_backend.repository.HlsMetadataRepository;
import com.dailyonemovie.dailyonemovie_backend.repository.MovieRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class MoviesService {

	private final MovieRepository moviesRepository;
	private final MovieStorageService storageService;
	private final HlsMetadataRepository hlsRepository;
	private final TaskExecutor taskExecutor;
	private final VideoProcessingService videoProcessService;
	Movies movie=null;

	public MoviesService(MovieRepository moviesRepository, MovieStorageService storageService,
			HlsMetadataRepository hlsrepo ,TaskExecutor taskExecutor,VideoProcessingService videoProcessService) {
		this.moviesRepository = moviesRepository;
		this.storageService = storageService;
		this.hlsRepository = hlsrepo;
		this.taskExecutor = taskExecutor;
		this.videoProcessService =videoProcessService ;
	}

	/**
	 * Save metadata + upload files
	 * 
	 * @throws IOException
	 */
	@Transactional
	public MoviesDTO saveMovie(Movies movie, MultipartFile movieFile, MultipartFile posterFile) throws IOException {

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

	public List<HlsDTO> fetchMovies() {
		List<Movies> movies = moviesRepository.findAll();

		if (movies == null || movies.isEmpty()) {
			return List.of();
		}

		return movies.stream().map(movie -> {
			String posterUrl = null;
			String playlistKey = null;

			// Poster presigned URL
			if (movie.getPosterKey() != null) {
				posterUrl = storageService.generatePresignedUrl(movie.getPosterKey(), Duration.ofHours(9));
			}

			// Lookup HLS metadata for this movie
			Optional<HlsMetadata> hlsOpt = hlsRepository.findByMovie(movie);
			if (hlsOpt.isPresent()) {
				playlistKey = hlsOpt.get().getPlaylistKey();
			}

			// Build DTO with correct mapping
			return new HlsDTO(movie.getId(), movie.getTitle(), movie.getGenre(), movie.getDuration(),
					movie.getRating(), movie.getPosterKey(), // stable poster key
					posterUrl, // presigned poster URL
					playlistKey // stable playlist key
			);
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

	public List<String> getListOfFileFromCloud() {
		return storageService.listFiles();
	}

	public MultipartInitResponse initiateMultipartUploadService(String fileName, int totalParts) {
		return storageService.initiateMultipartUpload(fileName, totalParts);
	}

	public void completeMultipartUploadService(String fileKey, String uploadId, List<CompletedPartDto> completedParts) {
		System.out.println("i am in movie service class and calling movie storage service class method....");

		storageService.completeMultipartUpload(fileKey, uploadId, completedParts);

	}

	public String getHlsMovieByID(Long id) {
		Movies movie = moviesRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));

		HlsMetadata hls = hlsRepository.findByMovie(movie)
				.orElseThrow(() -> new RuntimeException("HLS metadata not found"));

		// Generate presigned GET URL for playlist.m3u8

		String presignedUrl = storageService.generatePresignedUrl(hls.getPlaylistKey(), Duration.ofHours(9));
		return presignedUrl;
	}


    public MovieStatusDTO getStatus(Long id) {
        Movies movie = moviesRepository.findById(id).orElseThrow();
        return new MovieStatusDTO(movie.getId(), movie.getStatus(), movie.getProgress());
    }
	//function for get manifest url 
    public String buildPresignedManifest(Long movieId) {

        Movies movie = moviesRepository.findById(movieId)
                .orElseThrow(() ->
                        new RuntimeException("Movie not found"));

        HlsMetadata hls = hlsRepository.findByMovie(movie)
                .orElseThrow(() ->
                        new RuntimeException("HLS metadata not found"));

        String manifestKey = hls.getPlaylistKey();

        String prefix =
                manifestKey.substring(
                        0,
                        manifestKey.lastIndexOf("/") + 1
                );

        return storageService.buildPresignedManifest(manifestKey,prefix);
    }
    
    
    //----------------------------------------------------------------
    
    public Movies handleMovieUpload(MovieUploadRequest request) throws IOException {
        // Step 1: Upload poster outside database transaction context
        String posterKey = "posters/" + UUID.randomUUID() + "_" + request.posterFile().getOriginalFilename();
        storageService.uploadFile(posterKey, request.posterFile(), request.posterFile().getContentType());

        // Step 2: Save metadata and flush transaction entirely using a isolated self-contained method
        Movies movie = saveInitialMovieRecord(request, posterKey);

        // Step 3: Copy movie file to safe local temp storage location
        File safeCopy = File.createTempFile("movie_" + movie.getId(), ".mp4");
        request.movieFile().transferTo(safeCopy);

        // Step 4: Safe Async execution. The row is now guaranteed to exist in the DB!
        final Long movieId = movie.getId();
        taskExecutor.execute(() -> processMovieAsync(safeCopy, movieId));

        // Step 5: Clean, lightning-fast return
        return movie;
    }

    /**
     * Isolated transactional unit specifically for saving the raw entity metadata.
     * Connection is immediately returned to the pool once this method exits.
     */
    @Transactional
    public Movies saveInitialMovieRecord(MovieUploadRequest request, String posterKey) {
        Movies movie = new Movies();
        movie.setTitle(request.title());
        movie.setGenre(request.genre());
        movie.setDuration(request.duration());
        movie.setRating(request.rating());
        movie.setPosterKey(posterKey);
        movie.setStatus("UPLOADING");
        movie.setProgress(0);
        return moviesRepository.saveAndFlush(movie);
    }

    /**
     * Complete Asynchronous consumer engine. Run securely inside its own threads.
     */
    private void processMovieAsync(File movieFile, Long movieId) {
        try {
            updateStatusInDb(movieId, "CONVERTING_AND_STREAMING", 10);

            // Execute high performance dynamic FFmpeg streaming upload engine
            String playlistUrl = videoProcessService.convertAndUploadHls(
                movieFile,
                movieId,
                progress -> updateProgressInDb(movieId, progress)
            );

            // Persist metadata binding layers
            saveHlsMetadata(movieId, playlistUrl);

            // Complete lifecycle successfully
            updateFinalStatusInDb(movieId, "READY");
            
        } catch (Exception e) {
            System.err.println("Critical pipeline processing fault encountered on Movie ID: " + movieId);
            e.printStackTrace();
            updateStatusInDb(movieId, "FAILED", 0);
        } finally {
            if (movieFile != null && movieFile.exists()) {
                movieFile.delete();
            }
        }
    }

    /**
     * Isolated transaction unit to create the final HLS reference bindings.
     */
    @Transactional
    public void saveHlsMetadata(Long movieId, String playlistUrl) {
        HlsMetadata hlsMetadata = new HlsMetadata();
        Movies movieProxy = moviesRepository.getReferenceById(movieId);
        hlsMetadata.setMovie(movieProxy);
        hlsMetadata.setPlaylistKey(playlistUrl);
        hlsMetadata.setCreatedAt(Instant.now());
        hlsRepository.save(hlsMetadata);
    }

    /* * DATABASE STATE MODIFIERS
     * Requires Propagation.REQUIRES_NEW to ensure progress updates are immediately committed
     * and visible to client tracking polling intervals, independent of other steps.
     */

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateProgressInDb(Long movieId, int progress) {
        moviesRepository.updateMovieProgress(movieId, progress);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStatusInDb(Long movieId, String status, int progress) {
        moviesRepository.updateMovieProgress(movieId, progress);
        moviesRepository.updateFinalStatus(movieId, status);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateFinalStatusInDb(Long movieId, String status) {
        moviesRepository.updateFinalStatus(movieId, status);
        moviesRepository.updateMovieProgress(movieId, 100);
    }
    //-------------------------------------------
    
    @Transactional
    public boolean deleteHlsMovie(Long movieId) {

        Movies movie = moviesRepository.findById(movieId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Movie not found: " + movieId));

        HlsMetadata metadata =
                hlsRepository.findByMovie(movie)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Metadata not found"));

        boolean cloudDeleted =
                storageService.deleteMovieHlsFiles(
                        metadata.getPlaylistKey()
                );

        if (!cloudDeleted) {
            throw new RuntimeException(
                    "Cloud deletion failed"
            );
        }

        if (movie.getPosterKey() != null) {
            storageService.deletePosterFile(movie.getPosterKey());
        }

        hlsRepository.delete(metadata);
        moviesRepository.delete(movie);

        return true;
    }
}
