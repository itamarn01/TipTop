// Import necessary functions from Redux Toolkit
import { createSlice } from '@reduxjs/toolkit';

// Initial state of the slice
const initialState = {
    isTrackingPermission: false, // Default is false
};

// Create the slice
const trackingSlice = createSlice({
    name: 'tracking',
    initialState,
    reducers: {
        // Action to set isTrackingPermission to true
        setTrackingPermission: (state) => {
            state.isTrackingPermission = true;
        },
        // Action to clear (reset) isTrackingPermission to false
        clearTrackingPermission: (state) => {
            state.isTrackingPermission = false;
        },
    },
});

// Export the actions
export const { setTrackingPermission, clearTrackingPermission } = trackingSlice.actions;

// Export the reducer to include in your store
export default trackingSlice.reducer;
