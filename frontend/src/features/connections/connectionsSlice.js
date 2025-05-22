import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/connections/';

// --- Async Thunks ---

// Fetch all connections for the current user (sent, received, accepted)
export const fetchUserConnections = createAsyncThunk(
  'connections/fetchUserConnections',
  async (_, { rejectWithValue }) => {
    try {
      // You'll need a backend endpoint for this, e.g., GET /api/connections/my-connections
      // This endpoint should return all connections where the current user is either requester or recipient
      const response = await axios.get(`${API_BASE_URL}my-connections`); 
      return response.data; // Expected: { sent: [], received: [], active: [] } or a flat array with statuses
    } catch (error) {
      return rejectWithValue(error.response?.data || { msg: 'Failed to fetch connections' });
    }
  }
);

// Send a connection request
export const sendConnectionRequest = createAsyncThunk(
  'connections/sendConnectionRequest',
  async (recipientUserId, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}request/${recipientUserId}`);
      // Dispatch an action to add this new pending request to the state
      dispatch(addSentRequest(response.data)); // response.data should be the new connection object
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { msg: 'Failed to send request' });
    }
  }
);

// Accept a connection request
export const acceptConnectionRequest = createAsyncThunk(
  'connections/acceptConnectionRequest',
  async (connectionId, { dispatch, rejectWithValue }) => {
    try {
      // Backend endpoint: POST /api/connections/accept/:connection_id (or PUT)
      const response = await axios.post(`${API_BASE_URL}accept/${connectionId}`); 
      dispatch(updateConnectionStatus({ connectionId, status: 'connected', connection: response.data }));
      return response.data; // The updated connection object
    } catch (error) {
      return rejectWithValue(error.response?.data || { msg: 'Failed to accept request' });
    }
  }
);

// Reject a connection request
export const rejectConnectionRequest = createAsyncThunk(
  'connections/rejectConnectionRequest',
  async (connectionId, { dispatch, rejectWithValue }) => {
    try {
      // Backend endpoint: POST /api/connections/reject/:connection_id (or PUT/DELETE)
      const response = await axios.post(`${API_BASE_URL}reject/${connectionId}`);
      dispatch(updateConnectionStatus({ connectionId, status: 'declined', connection: response.data }));
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data || { msg: 'Failed to reject request' });
    }
  }
);

// Cancel a sent connection request (by requester)
export const cancelSentRequest = createAsyncThunk(
  'connections/cancelSentRequest',
  async (connectionId, { dispatch, rejectWithValue }) => {
    try {
        // Backend endpoint: DELETE /api/connections/:connection_id
        await axios.delete(`${API_BASE_URL}${connectionId}`);
        dispatch(removeConnection(connectionId));
        return connectionId;
    } catch (error) {
        return rejectWithValue(error.response?.data || { msg: 'Failed to cancel request' });
    }
  }
);

// Unfriend / Remove an active connection
export const removeActiveConnection = createAsyncThunk(
  'connections/removeActiveConnection',
  async (connectionId, { dispatch, rejectWithValue }) => {
    try {
        // Backend endpoint: DELETE /api/connections/:connection_id
        await axios.delete(`${API_BASE_URL}${connectionId}`);
        dispatch(removeConnection(connectionId));
        return connectionId;
    } catch (error) {
        return rejectWithValue(error.response?.data || { msg: 'Failed to remove connection' });
    }
  }
);


const initialState = {
  // Store connections in a structured way or flat list.
  // Flat list is often easier to manage with IDs.
  // Each connection object should contain requester, recipient, status, _id
  connections: [], // Array of connection objects
  isLoading: false,
  error: null,
  lastFetched: null, // Timestamp of last successful fetch
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    addSentRequest: (state, action) => {
      // action.payload is the new connection object from the API
      state.connections.push(action.payload);
    },
    updateConnectionStatus: (state, action) => {
      const { connectionId, status, connection } = action.payload;
      const index = state.connections.findIndex(conn => conn._id === connectionId);
      if (index !== -1) {
        if (connection) { // If full connection object is returned
            state.connections[index] = connection;
        } else { // Just update status
            state.connections[index].status = status;
        }
      }
    },
    removeConnection: (state, action) => {
        // action.payload is the connectionId
        state.connections = state.connections.filter(conn => conn._id !== action.payload);
    },
    clearConnectionsError: (state) => {
      state.error = null;
    },
    resetConnectionsState: () => initialState, // For logout
  },
  extraReducers: (builder) => {
    builder
      // fetchUserConnections
      .addCase(fetchUserConnections.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserConnections.fulfilled, (state, action) => {
        state.isLoading = false;
        // Assuming backend returns a flat array of all connection objects
        // If it returns { sent: [], received: [], active: [] }, you'd merge them here
        state.connections = action.payload; 
        state.lastFetched = Date.now();
      })
      .addCase(fetchUserConnections.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // sendConnectionRequest
      .addCase(sendConnectionRequest.pending, (state) => {
        // Can set a specific loading state if needed, e.g., for a particular user ID
        // state.isSendingRequest[action.meta.arg] = true; (if action.meta.arg is recipientUserId)
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        // Handled by the 'addSentRequest' reducer dispatched from the thunk
        // state.isSendingRequest[action.meta.arg] = false;
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.error = action.payload; // Or a specific error for this action
        // state.isSendingRequest[action.meta.arg] = false;
        console.error("Send connection request failed:", action.payload);
      })

      // acceptConnectionRequest
      .addCase(acceptConnectionRequest.pending, (state) => { /* Potentially set loading on specific connection */ })
      .addCase(acceptConnectionRequest.fulfilled, (state) => { /* Handled by updateConnectionStatus */ })
      .addCase(acceptConnectionRequest.rejected, (state, action) => { state.error = action.payload; })

      // rejectConnectionRequest
      .addCase(rejectConnectionRequest.pending, (state) => { /* ... */ })
      .addCase(rejectConnectionRequest.fulfilled, (state) => { /* Handled by updateConnectionStatus or removeConnection */ })
      .addCase(rejectConnectionRequest.rejected, (state, action) => { state.error = action.payload; })
      
      // cancelSentRequest
      .addCase(cancelSentRequest.pending, (state) => { /* ... */ })
      .addCase(cancelSentRequest.fulfilled, (state) => { /* Handled by removeConnection */ })
      .addCase(cancelSentRequest.rejected, (state, action) => { state.error = action.payload; })

      // removeActiveConnection
      .addCase(removeActiveConnection.pending, (state) => { /* ... */ })
      .addCase(removeActiveConnection.fulfilled, (state) => { /* Handled by removeConnection */ })
      .addCase(removeActiveConnection.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { 
    addSentRequest, 
    updateConnectionStatus,
    removeConnection,
    clearConnectionsError, 
    resetConnectionsState 
} = connectionsSlice.actions;

// --- Selectors ---
// Selector to get connection status with a specific user
export const selectConnectionWithUser = (state, otherUserId) => {
  const currentUserId = state.auth.user?.id;
  if (!currentUserId || !otherUserId) return null;

  return state.connections.connections.find(conn => 
    (conn.requester._id === currentUserId && conn.recipient._id === otherUserId) ||
    (conn.recipient._id === currentUserId && conn.requester._id === otherUserId)
  );
};

// Selector to get pending received requests
export const selectPendingReceivedRequests = (state) => {
    const currentUserId = state.auth.user?.id;
    if (!currentUserId) return [];
    return state.connections.connections.filter(
        conn => conn.recipient._id === currentUserId && conn.status === 'pending'
    );
};

// Selector to get active connections (friends)
export const selectActiveConnections = (state) => {
    const currentUserId = state.auth.user?.id;
    if (!currentUserId) return [];
    return state.connections.connections.filter(conn => conn.status === 'connected');
};


export default connectionsSlice.reducer;