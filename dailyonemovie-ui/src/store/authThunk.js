import { createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "./moviesThunk";

export const getCurrentUser = createAsyncThunk(
    "auth/getCurrentUser",
    async (_, { rejectWithValue }) => {
        try {

            const response = await API.get("/auth/me");

            return response.data;

        } catch (error) {

            return rejectWithValue(
                error.response?.data || "Failed to get user"
            );
        }
    }
);