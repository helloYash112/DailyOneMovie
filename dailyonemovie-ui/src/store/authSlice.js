import { createSlice } from "@reduxjs/toolkit";
import { fetchCurrentUser } from "./authThunk";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
  state.loading = false;
  state.isAuthenticated = action.payload.authenticated; // true
  state.user = action.payload;
})

      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || "Authentication failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
