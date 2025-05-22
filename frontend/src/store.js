import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import profileReducer from './features/profile/profileSlice';
import discoverReducer from './features/discover/discoverSlice';
import connectionsReducer from './features/connections/connectionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    discover: discoverReducer,
    connections: connectionsReducer,
  },
});