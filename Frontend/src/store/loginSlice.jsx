import { createSlice } from '@reduxjs/toolkit';

const loginModalSlice = createSlice({
  name: 'loginModal',
  initialState: {
    loginModal: { isOpen: false }
  },
  reducers: {
    openLoginModal: (state) => {
      state.loginModal.isOpen = true;
    },
    closeLoginModal: (state) => {
      state.loginModal.isOpen = false;
    },
    toggleLoginModal: (state) => {
      state.loginModal.isOpen = !state.loginModal.isOpen;
    }
  }
});

export const loginModalActions = loginModalSlice.actions;
const loginModalReducer = loginModalSlice.reducer;

export default loginModalReducer;
