import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import authReducer from './slices/authSlice'
import trackingReducer from './slices/trackingSlice'
import selectedClientReducer from './slices/selectedClientSlice';
export const store = configureStore({
    reducer: {
        user: userReducer,
        auth: authReducer,
        tracking: trackingReducer,
        selectedClient: selectedClientReducer
    },
});