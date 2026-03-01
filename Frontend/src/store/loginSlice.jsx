import { createSlice } from '@reduxjs/toolkit';

// helper to read token from storage
const getToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
};

const loginModalSlice = createSlice({
  name: 'loginModal',
  initialState: {
    loginModal: { isOpen: false, loginFailed: false },
    auth: {
      token: getToken(),
      isAuthenticated: !!getToken(),
      user: null,
      error: null
    }
  },
  reducers: {
    openLoginModal: (state) => {
      state.loginModal.isOpen = true;
    },
    closeLoginModal: (state) => {
      state.loginModal.isOpen = false;
      state.loginModal.loginFailed = false; // reset login failure state when closing modal
    },
    toggleLoginModal: (state) => {
      state.loginModal.isOpen = !state.loginModal.isOpen;
    },
    loginSuccess: (state, action) => {
      state.auth.token = action.payload.token;
      state.auth.isAuthenticated = true;
      state.auth.user = action.payload.user || null;
      state.auth.error = null;
      // persist token
      try {
        localStorage.setItem('authToken', action.payload.token);
        if (action.payload.user) {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      } catch {}
    },
    loginFailure: (state, action) => {
      state.auth.error = action.payload;
      state.loginModal.loginFailed = true;
    },
    logout: (state) => {
      state.auth.token = null;
      state.auth.isAuthenticated = false;
      state.auth.user = null;
      state.auth.error = null;
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } catch {}
    }
  }
});

export const loginModalActions = loginModalSlice.actions;
const loginModalReducer = loginModalSlice.reducer;

export default loginModalReducer;
