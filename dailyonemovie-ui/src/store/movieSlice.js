import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { data } from "react-router-dom";
import { normalizeFileType } from "../components/UploadMovies";
//const apiLink = import.meta.env.VITE_API_URL;
const apiLink = "http://localhost:8080";

const API = axios.create({
  baseURL: apiLink,
});
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

export const uploadMovieFlow = createAsyncThunk(
  "movies/uploadMovieFlow",

  async (payload, thunkAPI) => {
    try {
      const dispatch = thunkAPI.dispatch;

      const { movieFile, posterFile, title, genre, duration, rating } = payload;
      console.log("movie file:", movieFile);
      console.log("Type:", movieFile.type, "Size:", movieFile.size);
      console.log("poster file:", posterFile);
      console.log("Type:", posterFile.type, "Size:", posterFile.size);

     

      // 1. Get URLs
      const urls = await dispatch(
        getUploadURL({
          movieFileName: movieFile.name,
          movieFileType: normalizeFileType(movieFile.type),
          posterFileName: posterFile.name,
          posterFileType: normalizeFileType(posterFile.type),
        }),
      ).unwrap();
     // console.log("ui :",urls);
      // Upload movie
      await dispatch(
        uploadToCloudWithProgress({
          uploadURL: urls.movieUploadUrl,
          file: movieFile,
          type: "movie",
        }),
      ).unwrap();

      // Upload poster
      await dispatch(
        uploadToCloudWithProgress({
          uploadURL: urls.posterUploadUrl,
          file: posterFile,
          type: "poster",
        }),
      ).unwrap();

      // 4. Save movie
      const savedMovie = await dispatch(
        saveMovie({
          title,
          genre,
          duration,
          rating,
          movieKey: urls.movieKey,
          posterKey: urls.posterKey,
        }),
      ).unwrap();

      return savedMovie;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.message || "Upload flow failed");
    }
  },
);
//getting url to directly upload to cloud
export const getUploadURL = createAsyncThunk(
  "movies/getUploadURL",
  async (metaData, thunkAPI) => {
    try {
      const response = await API.post("/movies/upload-urls", metaData);

      return response.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data || "getting urls failure",
      );
    }
  },
);
//uploading file to server
export const uploadToCloudWithProgress = createAsyncThunk(
  "movies/uploadToCloudWithProgress",
  async ({ uploadURL, file, type }, thunkAPI) => {
    try {
      await axios.put(uploadURL, file, {
        headers: {}, 
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          if (type === "movie") thunkAPI.dispatch(setMovieProgress(percent));
          else if (type === "poster") thunkAPI.dispatch(setPosterProgress(percent));
        },
      });
      return true;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e?.response?.data || e.message || "upload failed",
      );
    }
  },
);

//saving movie meta data to database
export const saveMovie = createAsyncThunk(
  "movies/saveMovie",
  async (data, thunkAPI) => {
    try {
      const response = await API.post("movies/save-movie", data);
      return response.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(
        e.response?.data || "fail to save into the database...",
      );
    }
  },
);
//uploading movies to the data base                                                                                   ok
export const upload = createAsyncThunk(
  "movies/upload",
  async ({ data, onProgress }, thunkAPI) => {
    try {
      const response = await API.post("/movies/upload", data, {
        onUploadProgress: (ProgressEvent) => {
          if (ProgressEvent.total && onProgress) {
            const percent = Math.round(
              (ProgressEvent.loaded * 100) / ProgressEvent.total,
            );
            onProgress(percent);
          }
        },
      });

      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Upload failed");
    }
  },
);

//getting movie url                                                                                                  ok
export const getMovieURL = createAsyncThunk(
  "movies/getMovieURL",
  async (id, thunkAPI) => {
    try {
      const response = await API.get(`/movies/${id}/stream`);

      return {
        id,
        movieUrl: response.data,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to fetch movie URL",
      );
    }
  },
);
//getting poster url                                                                                                  ok
export const getPosterURL = createAsyncThunk(
  "movies/getPosterURL",
  async (id, thunkAPI) => {
    try {
      const response = await API.get(`/movies/${id}/poster`);

      return {
        id,
        posterUrl: response.data,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to fetch poster URL",
      );
    }
  },
);

//getting all movies                                                                                                   ok
export const fetchMovies = createAsyncThunk(
  "movies/fetchMovies",
  async (_, thunkAPI) => {
    try {
      const response = await API.get("/movies");
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to fetch movies",
      );
    }
  },
);

//delete movies and poster from the data base                                                         ok
export const deleteMovieAndPoster = createAsyncThunk(
  "movies/deleteMovieAndPoster",
  async (id, thunkAPI) => {
    try {
      await API.delete(`/movies/${id}`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data || "Failed to delete movie",
      );
    }
  },
);
const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    movies: [],

    status: "idle",
    // idle | loading | uploading | saving | success | fail

    error: null,

    movieProgress: 0,
    posterProgress: 0,

    currentStep: "",
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
