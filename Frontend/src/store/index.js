import { configureStore } from '@reduxjs/toolkit';
import loginModalReducer from './loginSlice';

const store = configureStore({
  reducer: {
    loginModal: loginModalReducer
  }
});

export default store;