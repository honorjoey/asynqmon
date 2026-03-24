import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  username: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ username: string }>) {
      state.isAuthenticated = true;
      state.username = action.payload.username;
      state.loading = false;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.username = null;
      state.loading = false;
      state.error = action.payload;
    },
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.username = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { loginSuccess, loginFailure, loginStart, logout } =
  authSlice.actions;
export default authSlice.reducer;
