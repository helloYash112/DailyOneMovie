package com.dailyonemovie.dailyonemovie_backend.controler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.dailyonemovie.dailyonemovie_backend.DTO.CompleteMultipartRequest;
import com.dailyonemovie.dailyonemovie_backend.DTO.CompletedPartDto;
import com.dailyonemovie.dailyonemovie_backend.DTO.HlsDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MovieStatusDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MovieUploadRequest;
import com.dailyonemovie.dailyonemovie_backend.DTO.MoviesDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitRequest;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitResponse;
import com.dailyonemovie.dailyonemovie_backend.entity.Movies;
import com.dailyonemovie.dailyonemovie_backend.service.MoviesService;
import com.dailyonemovie.dailyonemovie_backend.service.ServerStatus;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;




@RestController
@RequestMapping("/movies")
public class MoviesController {

	private final MoviesService moviesService;

	public MoviesController(MoviesService moviesService) {
		this.moviesService = moviesService;
	}

	@PostMapping("/upload")
	public ResponseEntity<MoviesDTO> uploadMovie(
			@ModelAttribute MovieUploadRequest request) throws IOException {
		Movies movie = new Movies();

		movie.setTitle(request.title());
		movie.setGenre(request.genre());
		movie.setDuration(request.duration());
		movie.setRating(request.rating());

		// Better unique filenames
		String movieKey = UUID.randomUUID() + "_" + request.movieFile().getOriginalFilename();
		String posterKey = UUID.randomUUID() + "_" + request.posterFile().getOriginalFilename();

		movie.setMovieKey(movieKey);
		movie.setPosterKey(posterKey);

		MoviesDTO saved = moviesService.saveMovie(
				movie,
				request.movieFile(),
				request.posterFile());

		return ResponseEntity.ok(saved);
	}

	@PostMapping("/prepare-upload")
	public ResponseEntity<?> prepare(@RequestBody Map<String, String> request) {
		// Generate unique keys so files never overwrite each other
		String movieKey = UUID.randomUUID() + "_" + request.get("movieName");
		String posterKey = UUID.randomUUID() + "_" + request.get("posterName");

		// Generate the temporary URLs for the browser
		String movieUrl = moviesService.getUploadUrl(movieKey, "video/mp4");
		String posterUrl = moviesService.getUploadUrl(posterKey, "image/jpeg");

		return ResponseEntity.ok(Map.of(
				"movieUrl", movieUrl, "posterUrl", posterUrl,
				"movieKey", movieKey, "posterKey", posterKey));
	}
	@PostMapping("/prepare-url")
	public ResponseEntity<?> getPutUrl(@RequestBody Map<String, String> request) {
	    // Expect: { "fileName": "example.mp4", "contentType": "video/mp4" }
	    String fileName = request.get("fileName");
	    String contentType = request.get("contentType");

	    // Generate unique key to avoid overwrites
	    String objectKey = "large-uploads/"+UUID.randomUUID() + "_" + fileName;

	    // Generate upload URL
	    String uploadUrl = moviesService.getUploadUrl(objectKey, contentType);

	    return ResponseEntity.ok(Map.of(
	            "uploadUrl", uploadUrl,
	            "objectKey", objectKey
	    ));
	}

	@PostMapping("/confirm-save")
	public ResponseEntity<?> save(@RequestBody Movies movie) {
		
		if (movie.getMovieKey() == null || movie.getPosterKey() == null) {
			return ResponseEntity.badRequest().body("Missing file keys!");
		}
		return ResponseEntity.ok(moviesService.saveAndReturnMovie(movie));
	}



	/** Upload a new movie + poster 
	 * @throws IOException */
	@PostMapping("/formupload")
	public ResponseEntity<MoviesDTO> uploadMovie(@RequestParam("title") String title,
			@RequestParam("genre") String genre,
			@RequestParam("duration") int duration, @RequestParam("rating") double rating,
			@RequestParam("movieFile") MultipartFile movieFile, @RequestParam("posterFile") MultipartFile posterFile) throws IOException {

		Movies movie = new Movies();

		movie.setTitle(title);
		movie.setGenre(genre);
		movie.setDuration(duration);
		movie.setRating(rating);

		// Better unique filenames
		String movieKey = UUID.randomUUID() + "_" + movieFile.getOriginalFilename();
		String posterKey = UUID.randomUUID() + "_" + posterFile.getOriginalFilename();

		movie.setMovieKey(movieKey);
		movie.setPosterKey(posterKey);

		MoviesDTO saved = moviesService.saveMovie(movie, movieFile, posterFile);

		return ResponseEntity.ok(saved);
	}

	/** Get movie metadata */
	@GetMapping("/{id}")
	public ResponseEntity<Movies> getMovie(@PathVariable Long id) {
		return moviesService.getMovie(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	/** Stream movie (pre-signed URL) */
	@GetMapping("/{id}/stream")
	public ResponseEntity<String> streamMovie(@PathVariable Long id) {
		String url = moviesService.getMovieStreamUrl(id);
		return ResponseEntity.ok(url);
	}

	/** Get poster (pre-signed URL) */
	@GetMapping("/{id}/poster")
	public ResponseEntity<String> getPoster(@PathVariable Long id) {
		String url = moviesService.getPosterUrl(id);
		return ResponseEntity.ok(url);
	}

	/** Delete movie */
	@DeleteMapping("/{id}")
	public ResponseEntity<Boolean> deleteMovie(@PathVariable Long id) {
		boolean status= moviesService.deleteHlsMovie(id);
		return ResponseEntity.ok(status);
	}
	// getting all movies from database

	@GetMapping
	public ResponseEntity<List<HlsDTO>> fetchMovies() {
		return ResponseEntity.ok(moviesService.fetchMovies());
	}
	@GetMapping("/all/movies")
	public List<String> getMoviesFromCloud(){
		return moviesService.getListOfFileFromCloud();
	}
	@PostMapping("/initiate")
    public ResponseEntity<MultipartInitResponse> initiate(@RequestBody MultipartInitRequest request) {
        MultipartInitResponse response = moviesService.initiateMultipartUploadService(
                request.fileName(), request.totalParts());
        return ResponseEntity.ok(response);
    }

	@PostMapping("/complete")
	public ResponseEntity<?> completeUpload(
	        @RequestBody CompleteMultipartRequest request
	) {
	    String uploadId = request.uploadId();
	    String fileKey = request.fileKey();
	    List<CompletedPartDto> completedParts = request.parts();
	    System.out.println("calling a movie service class method");
	    moviesService.completeMultipartUploadService(fileKey, uploadId, completedParts);
	    System.out.println("movie completed sucessfull...");

	    return ResponseEntity.ok("success");
	}
	@PostMapping("/hls/upload")
	public Map<String,Object> upload(@ModelAttribute MovieUploadRequest request) throws IOException {
		Movies movie=moviesService.handleMovieUpload(request);
	     return Map.of("id", movie.getId(), "status", "Success");
	}


    @GetMapping("/{id}/hls-stream")
    public ResponseEntity<String> streamHlsMovie(@PathVariable Long id) {
    	String url= moviesService.getHlsMovieByID(id);
       return ResponseEntity.ok(url);
    }

    
    @GetMapping("/{id}/status")
    public ResponseEntity<MovieStatusDTO> getStatus(@PathVariable Long id) {
        return ResponseEntity.ok(moviesService.getStatus(id));
    }

    @RequestMapping(
            value = "/{id}/manifest",
            method = {RequestMethod.GET, RequestMethod.HEAD} // Listens to both methods to prevent 500/405 errors
    )
    public ResponseEntity<String> getManifest(
            @PathVariable Long id,
            HttpMethod method) { // Dynamically captures whether it's a GET or HEAD request

        String manifest = moviesService.buildPresignedManifest(id);

        if (manifest == null) {
            return ResponseEntity.notFound().build();
        }

        // Build the precise content type and metadata headers manually
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.apple.mpegurl"));
        headers.setContentLength(manifest.getBytes(StandardCharsets.UTF_8).length);
        headers.setCacheControl("no-store, no-cache, must-revalidate");

        // CRITICAL FIX: If it's a HEAD request, return immediately with just the headers.
        // This prevents the framework from trying to map a body to a response that must not have one.
        if (HttpMethod.HEAD.equals(method)) {
            return ResponseEntity.ok()
                    .headers(headers)
                    .build(); 
        }

        // Standard response layout for regular GET streaming traffic
        return ResponseEntity.ok()
                .headers(headers)
                .body(manifest);
    }
    
    @GetMapping("/health")
    public ResponseEntity<ServerStatus> health() {

        ServerStatus status =
                new ServerStatus(
                        true,
                        System.currentTimeMillis()
                );

        return ResponseEntity.ok(status);
    }
  

}
