import { createSlice } from "@reduxjs/toolkit";
import {
  uploadMoviePipeline,
  initiateMultiUploads,
  completeMultiUploads,
  uploadMovieFlow,
  getUploadURL,
  uploadToCloudWithProgress,
  saveMovie,
  upload,
  getMovieURL,
  getPosterURL,
  fetchMovies,
  deleteMovieAndPoster,
  uploadHlsMovie,
  checkBackendHealth
} from "./moviesThunk";

/*
const Movie = {
  id: null,
  title: null,
  genre: null,
  duration: null,
  rating: null,
  movieKey: null,
  posterKey: null,
  movieUrl: null,
  posterUrl: null,
};
*/

const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    movies: [],

    // Upload lifecycle
    status: "idle", // idle | uploading | success | fail
    currentMovieId: null,

    // Fetch lifecycle
    fetchStatus: "idle", // idle | loading | success | fail

    error: null,

    movieProgress: 0,
    posterProgress: 0,

    currentStep: "",
    backendAlive: false,
    backendLoading: false,
    backendTimestamp: null,
    backendError: null,
  },

  reducers: {
    addMovie: (state, action) => {
      state.movies.push(action.payload);
    },

    removeMovie: (state, action) => {
      state.movies = state.movies.filter(
        (movie) => movie.id !== action.payload,
      );
    },

    updateMovieUrls: (state, action) => {
      const { id, movieUrl, posterUrl } = action.payload;

      const movie = state.movies.find((m) => m.id === id);

      if (movie) {
        movie.movieUrl = movieUrl;
        movie.posterUrl = posterUrl;
      }
    },

    clearMovies: (state) => {
      state.movies = [];
      state.status = "idle";
      state.error = null;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.status = "fail";
    },

    setMovieProgress: (state, action) => {
      state.movieProgress = action.payload;
    },

    setPosterProgress: (state, action) => {
      state.posterProgress = action.payload;
    },

    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    resetUploadState: (state) => {
      state.status = "idle";
      state.error = null;
      state.movieProgress = 0;
      state.posterProgress = 0;
      state.currentStep = "";
    },
  },

  extraReducers: (builder) => {
    builder
      //getting all movies data for streaming
      .addCase(fetchMovies.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.status = "success";
        state.movies = action.payload;
      })
      .addCase(fetchMovies.rejected, (state) => {
        state.status = "error";
        state.error = action.payload;
      })
      //uploading movie to the data base
      .addCase(upload.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(upload.fulfilled, (state, action) => {
        ((state.status = "success"), state.movies.push(action.payload));
      })
      .addCase(upload.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload;
      })
      .addCase(getMovieURL.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getMovieURL.fulfilled, (state, action) => {
        state.status = "success";
        const { id, movieUrl } = action.payload;
        const movie = state.movies.find((m) => m.id === id);

        if (movie) {
          movie.movieUrl = movieUrl;
        }
      })
      .addCase(getMovieURL.rejected, (state) => {
        state.status = "error";
        state.error = action.payload;
      })
      //getting poster url
      .addCase(getPosterURL.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getPosterURL.fulfilled, (state, action) => {
        state.status = "success";
        const { id, posterUrl } = action.payload;
        const movie = state.movies.find((m) => m.id === id);

        if (movie) {
          movie.posterUrl = posterUrl;
        }
      })
      .addCase(getPosterURL.rejected, (state) => {
        state.status = "error";
        state.error = action.payload;
      })
      .addCase(deleteMovieAndPoster.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteMovieAndPoster.fulfilled, (state, action) => {
        state.movies = state.movies.filter(
          (movie) => movie.id !== action.payload,
        );
      })
      .addCase(deleteMovieAndPoster.rejected, (state) => {
        state.status = "error";
        state.error = action.payload;
      })
      //getting url for directly upload to url
      .addCase(getUploadURL.pending, (state) => {
        state.status = "loading";
        state.currentStep = "Getting upload URLs...";
        state.error = null;
      })

      .addCase(getUploadURL.fulfilled, (state) => {
        state.status = "success";
      })

      .addCase(getUploadURL.rejected, (state, action) => {
        state.status = "fail";
        state.error = action.payload;
      })
      //uploading file to the cloud
      .addCase(uploadToCloudWithProgress.pending, (state) => {
        state.status = "uploading";
        state.error = null;
      })

      .addCase(uploadToCloudWithProgress.fulfilled, (state) => {
        state.status = "success";
      })

      .addCase(uploadToCloudWithProgress.rejected, (state, action) => {
        state.status = "fail";
        state.error = action.payload;
      })
      //save meta data into the database
      .addCase(saveMovie.pending, (state) => {
        state.status = "saving";
        state.currentStep = "Saving movie...";
        state.error = null;
      })

      .addCase(saveMovie.fulfilled, (state, action) => {
        state.status = "success";

        // add newly saved movie into movies array
        state.movies.push(action.payload);

        // reset progress after success
        state.movieProgress = 100;
        state.posterProgress = 100;

        state.currentStep = "Upload completed";
      })
      .addCase(saveMovie.rejected, (state, action) => {
        state.status = "fail";
        state.error = action.payload;
      })
      //archester for following think getupladurl,uploadtocloud,savetodatabase
      .addCase(uploadMovieFlow.pending, (state) => {
        state.status = "loading";
        state.currentStep = "Starting upload...";
        state.error = null;

        state.movieProgress = 0;
        state.posterProgress = 0;
      })

      .addCase(uploadMovieFlow.fulfilled, (state) => {
        state.status = "success";
        state.currentStep = "Movie uploaded successfully";
      })

      .addCase(uploadMovieFlow.rejected, (state, action) => {
        state.status = "fail";
        state.error = action.payload;
        state.currentStep = "Upload failed";
      })
      .addCase(uploadHlsMovie.pending, (state) => {
        state.status = "uploading";
        state.error = null;
      })
      .addCase(uploadHlsMovie.fulfilled, (state, action) => {
        state.status = "success";
        state.currentMovieId = action.payload.id; // store returned id
      })
      .addCase(uploadHlsMovie.rejected, (state, action) => {
        state.status = "fail";
        state.error = action.payload;
      })
    .addCase(checkBackendHealth.pending, (state) => {
        state.backendLoading = true;
        state.backendError = null;
    })

    .addCase(checkBackendHealth.fulfilled, (state, action) => {
        state.backendLoading = false;
        state.backendAlive = action.payload.alive;
        state.backendTimestamp = action.payload.timestamp;
        state.backendError = null;
    })

    .addCase(checkBackendHealth.rejected, (state, action) => {
        state.backendLoading = false;
        state.backendAlive = false;
        state.backendTimestamp = null;
        state.backendError = action.payload?.error || "Backend unavailable";
    });
  },
});

export const {
  addMovie,
  removeMovie,
  updateMovieUrls,
  clearMovies,
  setStatus,
  setError,
  setMovieProgress,
  setPosterProgress,
  setStep,
  resetUploadState,
} = moviesSlice.actions;

export default moviesSlice.reducer;
