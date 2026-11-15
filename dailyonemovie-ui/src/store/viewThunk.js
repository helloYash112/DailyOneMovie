import { createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";
export const apiLink = import.meta.env.VITE_API_URL;

export const API_URL = axios.create({
  baseURL: apiLink,
  withCredentials: true, // critical
});
/**
 * url/movies
 * url/movies/id
 * url/health
 */


// 1. Get all movies
export const fetchMovies = createAsyncThunk(
  "movies/fetchMovies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/movies`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 2. Get movie by ID
export const fetchMovieById = createAsyncThunk(
  "movies/fetchMovieById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/movies/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// 3. Check API health
export const checkApiHealth = createAsyncThunk(
  "movies/checkApiHealth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);


