import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/profiles/';

// Async Thunk to fetch profiles
export const fetchProfiles = createAsyncThunk(
  'discover/fetchProfiles',
  async (params, { rejectWithValue, getState }) => {
    // Params can include: { page, limit, interests, minAge, maxAge, searchTerm (if backend supports) }
    const { discover } = getState();
    const currentFilters = discover.filters;
    const currentPage = discover.pagination.currentPage;

    const queryParams = {
      page: params?.page || currentPage,
      limit: params?.limit || 10, // Default limit
      ...currentFilters, // Spread existing filters
      ...params, // Override with new params if provided
    };

    // Remove undefined or empty filter values
    Object.keys(queryParams).forEach(key => 
      (queryParams[key] === undefined || queryParams[key] === '') && delete queryParams[key]
    );

    try {
      const response = await axios.get(API_URL, { params: queryParams });
      return response.data; // Expect { profiles: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data || { msg: 'Failed to fetch profiles' });
    }
  }
);

const initialState = {
  profiles: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProfiles: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10,
  },
  filters: {
    interests: '', // comma-separated string
    minAge: '',
    maxAge: '',
    searchTerm: '', // For username search - will need backend support
    // lat: '', lng: '', distance: '' // For location based, if you implement UI for it
  },
  isLoading: false,
  error: null,
};

const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to page 1 when filters change
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearDiscoverError: (state) => {
      state.error = null;
    },
    resetDiscoverState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profiles = action.payload.profiles;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, setPage, clearDiscoverError, resetDiscoverState } = discoverSlice.actions;
export default discoverSlice.reducer;