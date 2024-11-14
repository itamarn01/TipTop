import { createSlice } from '@reduxjs/toolkit';

const selectedClientSlice = createSlice({
    name: 'selectedClient',
    initialState: null,
    reducers: {
        setSelectedClient: (state, action) => {
            return action.payload;
        },
        clearSelectedClient: () => {
            return null;
        },
    },
});

export const { setSelectedClient, clearSelectedClient } = selectedClientSlice.actions;

export default selectedClientSlice.reducer;
