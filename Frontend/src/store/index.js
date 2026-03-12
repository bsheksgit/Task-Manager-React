import { configureStore } from '@reduxjs/toolkit';
import loginModalReducer from './loginSlice';
import commonReducer from './commonSlice';
import userReducer from './userSlice';

const store = configureStore({
  reducer: {
    loginModal: loginModalReducer,
    common: commonReducer,
    user: userReducer
  }
});

export default store;