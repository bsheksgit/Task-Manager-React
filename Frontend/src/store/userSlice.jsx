import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userDetails: {name: '', email: ''},
    userTasks: []

  },
  reducers: {

  }
});

export const userActions = userSlice.actions;
const userReducer = userSlice.reducer;

export default userReducer;
