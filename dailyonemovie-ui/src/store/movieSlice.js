import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * task done...
 * upload function created
 * movie url function is created
 * poster url function is created
 * delete movie and poster function created
 * fetchmovies function is complited
 */

const API = axios.create({
  baseURL: "https://dailyonemovie.onrender.com/",
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

//uploading movies to the data base                                                                                   ok
export const upload = createAsyncThunk(
  "movies/upload",
  async ({data,onProgress}, thunkAPI) => {
    try {
      const response = await API.post("/movies/upload", data,{
        onUploadProgress:(ProgressEvent)=>{
          if(ProgressEvent.total && onProgress){
            const percent=Math.round((ProgressEvent.loaded * 100)/ProgressEvent.total);
            onProgress(percent);
          }
        }
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
    status: "idle", // idle | loading | success | fail
    error: null,
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
      .addCase(upload.rejected, (state,action) => {
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
      .addCase(getMovieURL.rejected,state=>{
         state.status = "error";
        state.error = action.payload;
      })
      //getting poster url
      .addCase(getPosterURL.pending,state=>{
         state.status = "loading";
        state.error = null;

      })
      .addCase(getPosterURL.fulfilled,(state,action)=>{
        state.status = "success";
        const { id, posterUrl } = action.payload;
        const movie = state.movies.find((m) => m.id === id);

        if (movie) {
          movie.posterUrl = posterUrl;
        }

      })
      .addCase(getPosterURL.rejected,state=>{
        state.status = "error";
        state.error = action.payload;

      })
      .addCase(deleteMovieAndPoster.pending,state=>{
         state.status = "loading";
        state.error = null;

      })
      .addCase(deleteMovieAndPoster.fulfilled,(state,action)=>{
        state.movies = state.movies.filter(
        (movie) => movie.id !== action.payload,
      );

      })
      .addCase(deleteMovieAndPoster.rejected,state=>{
        state.status = "error";
        state.error = action.payload;

      })
  },
});

export const { addMovie, removeMovie, updateMovieUrls, clearMovies } =
  moviesSlice.actions;

export default moviesSlice.reducer;
