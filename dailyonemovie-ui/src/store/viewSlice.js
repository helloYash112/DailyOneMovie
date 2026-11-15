
import { createSlice } from "@reduxjs/toolkit";

import {
  fetchMovies,
  fetchMovieById,
  checkApiHealth
} from "./viewThunk";

const initialState = {
  movies: [],
  selectedMovie: null,
  apiHealth: null,

  loading: false,
  error: null
};

const viewSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {},

  extraReducers: (builder) => {

    builder
      // Fetch all movies
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch movie by ID
      .addCase(fetchMovieById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMovie = action.payload;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // API health
      .addCase(checkApiHealth.fulfilled, (state, action) => {
        state.apiHealth = action.payload;
      });
  }
});

export default viewSlice.reducer;
