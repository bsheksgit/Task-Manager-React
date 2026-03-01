import { createSlice } from '@reduxjs/toolkit';

const commonSlice = createSlice({
  name: 'common',
  initialState: {
    snackbar: { isOpen: false, message: '' },
    errorModal: { isOpen: false, message: '' }
  },
  reducers: {
    openSnackbar: (state, action) => {
      state.snackbar = { isOpen: true, message: action.payload.message };
    },
    closeSnackbar: (state) => {
      state.snackbar = { isOpen: false, message: '' };
    }
  }
});

export const commonActions = commonSlice.actions;
const commonReducer = commonSlice.reducer;

export default commonReducer;
