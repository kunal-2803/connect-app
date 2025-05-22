import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/'; // Your backend URL

// Helper to set token in localStorage and Axios headers
const setAuthData = (state, { token, user }) => {
  localStorage.setItem('token', token);
  axios.defaults.headers.common['x-auth-token'] = token;
  state.token = token;
  state.user = user;
  state.isAuthenticated = true;
  state.isLoading = false;
  state.error = null;
};

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL + 'register', userData);
      return response.data; // { token, user }
    } catch (error) {
      return rejectWithValue(error.response.data.errors || [{ msg: 'Registration failed' }]);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL + 'login', userData);
      return response.data; // { token, user }
    } catch (error) {
      return rejectWithValue(error.response.data.errors || [{ msg: 'Login failed' }]);
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue, getState }) => {
    console.log('loadUser thunk started');
    const token = getState().auth.token || localStorage.getItem('token');
    console.log('Token in loadUser:', !!token);
    
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      try {
        console.log('Making request to load user');
        const response = await axios.get(API_URL + 'user');
        console.log('User loaded successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error loading user:', error.response?.data);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        return rejectWithValue(error.response?.data?.msg || 'Failed to load user');
      }
    }
    console.log('No token found in loadUser');
    return rejectWithValue('No token found');
  }
);

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  isLoading: false,
  user: null,
  error: null,
};

console.log('Initial auth state:', initialState);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.user = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuthFromToken: (state, action) => { // For Google OAuth callback
      const { token, user } = action.payload; // Assume backend provides user data with token
      setAuthData(state, { token, user });
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        setAuthData(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('token');
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        setAuthData(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('token');
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        // Don't set error here if it's just 'No token found' during initial load
        if (action.payload !== 'No token found') {
            state.error = [{ msg: action.payload }];
        }
        localStorage.removeItem('token');
      });
  },
});

export const { logout, clearError, setAuthFromToken } = authSlice.actions;
export default authSlice.reducer;