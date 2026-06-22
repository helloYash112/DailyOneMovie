import { createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "./moviesThunk";

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/auth/me");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Authentication failed"
      );
    }
  }
);