package com.dailyonemovie.dailyonemovie_backend.controler;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import com.dailyonemovie.dailyonemovie_backend.DTO.MovieUploadRequest;
import com.dailyonemovie.dailyonemovie_backend.DTO.MoviesDTO;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitRequest;
import com.dailyonemovie.dailyonemovie_backend.DTO.MultipartInitResponse;
import com.dailyonemovie.dailyonemovie_backend.entity.Movies;
import com.dailyonemovie.dailyonemovie_backend.service.MoviesService;

//@CrossOrigin(origins = "https://dailyonemovie.netlify.app")
@CrossOrigin(origins = "http://localhost:5173/")
@RestController
@RequestMapping("/movies")
public class MoviesController {

	private final MoviesService moviesService;

	public MoviesController(MoviesService moviesService) {
		this.moviesService = moviesService;
	}

	@PostMapping("/upload")
	public ResponseEntity<MoviesDTO> uploadMovie(
			@ModelAttribute MovieUploadRequest request) {
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

	@PostMapping("/confirm-save")
	public ResponseEntity<?> save(@RequestBody Movies movie) {
		
		if (movie.getMovieKey() == null || movie.getPosterKey() == null) {
			return ResponseEntity.badRequest().body("Missing file keys!");
		}
		return ResponseEntity.ok(moviesService.saveAndReturnMovie(movie));
	}



	/** Upload a new movie + poster */
	@PostMapping("/formupload")
	public ResponseEntity<MoviesDTO> uploadMovie(@RequestParam("title") String title,
			@RequestParam("genre") String genre,
			@RequestParam("duration") int duration, @RequestParam("rating") double rating,
			@RequestParam("movieFile") MultipartFile movieFile, @RequestParam("posterFile") MultipartFile posterFile) {

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
	public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
		moviesService.deleteMovie(id);
		return ResponseEntity.noContent().build();
	}
	// getting all movies from database

	@GetMapping
	public ResponseEntity<List<MoviesDTO>> fetchMovies() {
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
}
