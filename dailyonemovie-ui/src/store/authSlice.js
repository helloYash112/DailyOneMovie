import { createSlice } from "@reduxjs/toolkit";
import { getCurrentUser } from "./authThunk";

const initialState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
        },
    },

    extraReducers: (builder) => {

        builder

            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })

            .addCase(getCurrentUser.fulfilled, (state, action) => {

                state.loading = false;

                if (action.payload.authenticated) {

                    state.isAuthenticated = true;
                    state.user = action.payload;

                } else {

                    state.isAuthenticated = false;
                    state.user = null;
                }
            })

            .addCase(getCurrentUser.rejected, (state, action) => {

                state.loading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            });
    },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
