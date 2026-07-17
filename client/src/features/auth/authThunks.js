import { createAsyncThunk } from "@reduxjs/toolkit";
import { 
  loginUser, 
  registerUser, 
  getMeUser, 
  googleLoginUser, 
  loginVerify2FAUser 
} from "./authAPI";

export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const response = await registerUser(userData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { message: "Registration failed" }
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      const response = await loginUser(userData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || { message: "Login failed" }
      );
    }
  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, thunkAPI) => {
    try {
      const response = await getMeUser();
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Session load failed"
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async ({ credential, role }, thunkAPI) => {
    try {
      const response = await googleLoginUser(credential, role);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Google authentication failed"
      );
    }
  }
);

export const loginVerify2FA = createAsyncThunk(
  "auth/loginVerify2FA",
  async ({ userId, token }, thunkAPI) => {
    try {
      const response = await loginVerify2FAUser(userId, token);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Invalid 2FA code"
      );
    }
  }
);