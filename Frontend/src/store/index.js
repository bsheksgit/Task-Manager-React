import { configureStore } from '@reduxjs/toolkit';
import loginModalReducer from './loginSlice';
import commonReducer from './commonSlice';

const store = configureStore({
  reducer: {
    loginModal: loginModalReducer,
    common: commonReducer
  }
});

export default store;