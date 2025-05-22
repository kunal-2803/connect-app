import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/profiles/';

// Async Thunks
export const getCurrentProfile = createAsyncThunk(
  'profile/getCurrentProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL + 'me');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 400) {
         // 400 from /me endpoint means profile not found, not necessarily a 'bad request' error
        return rejectWithValue({ msg: 'Profile not found', status: 400 });
      }
      return rejectWithValue(error.response?.data?.errors || error.response?.data || { msg: 'Failed to fetch profile' });
    }
  }
);

export const createOrUpdateProfile = createAsyncThunk(
  'profile/createOrUpdateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || [{ msg: 'Failed to save profile' }]);
    }
  }
);

export const uploadVerificationPhotos = createAsyncThunk(
  'profile/uploadVerificationPhotos',
  async (formData, { rejectWithValue }) => { // formData should be an instance of FormData
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await axios.post(API_URL + 'upload-verification-photos', formData, config);
      return response.data; // { photos: [...] }
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data || [{ msg: 'Failed to upload photos' }]);
    }
  }
);
// If you add profile picture upload separately:
export const uploadProfilePicture = createAsyncThunk(
  'profile/uploadProfilePicture',
  async (formData, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await axios.post(API_URL + 'upload-profile-picture', formData, config);
      return response.data; // { url, profile }
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data || [{ msg: 'Failed to upload profile picture' }]);
    }
  }
);

export const searchProfiles = createAsyncThunk(
  'profile/searchProfiles',
  async (username, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}search/${username}`);
      return {
        profiles: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalProfiles: response.data.length,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to search profiles');
    }
  }
);

export const fetchProfiles = createAsyncThunk(
  'profile/fetchProfiles',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      const response = await axios.get(`${API_URL}?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch profiles');
    }
  }
);

const initialState = {
  profile: null,
  profiles: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProfiles: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  },
  isLoading: false,
  error: null,
  searchTerm: '',
  profileStatus: 'idle',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    resetProfileState: (state) => {
      return { ...initialState };
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // getCurrentProfile
      .addCase(getCurrentProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        // If profile exists and has verification photos, set status accordingly
        if (action.payload && action.payload.verificationPhotos && action.payload.verificationPhotos.length > 0) {
            state.profileStatus = 'underReview'; // Or some other status indicating photos are submitted
        } else if (action.payload) {
            state.profileStatus = 'profileExistsNoPhotos'; // Profile exists but needs photos
        } else {
            state.profileStatus = 'noProfile'; // Should be handled by rejected generally
        }
      })
      .addCase(getCurrentProfile.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload && action.payload.status === 400) {
          state.profile = null; // Explicitly null if profile not found
          state.profileStatus = 'noProfile';
        } else {
          state.error = action.payload;
        }
      })
      // createOrUpdateProfile
      .addCase(createOrUpdateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrUpdateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
        state.profileStatus = 'profileCreated';
      })
      .addCase(createOrUpdateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // uploadVerificationPhotos
      .addCase(uploadVerificationPhotos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadVerificationPhotos.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.verificationPhotos = action.payload.photos; // Update photos in current profile
        }
        state.error = null;
        state.profileStatus = 'photosUploaded'; // This implies under review
      })
      .addCase(uploadVerificationPhotos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // uploadProfilePicture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.profilePicture = action.payload.url;
        }
        // Or if the backend returns the full profile: state.profile = action.payload.profile;
        state.error = null;
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // searchProfiles
      .addCase(searchProfiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProfiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profiles = action.payload.profiles;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchProfiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // fetchProfiles
      .addCase(fetchProfiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.isLoading = false;
        // If it's the first page or a new search, replace the profiles
        // Otherwise, append the new profiles
        if (action.meta.arg.page === 1) {
          state.profiles = action.payload.profiles;
        } else {
          state.profiles = [...state.profiles, ...action.payload.profiles];
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfileError, resetProfileState, setSearchTerm } = profileSlice.actions;
export default profileSlice.reducer;