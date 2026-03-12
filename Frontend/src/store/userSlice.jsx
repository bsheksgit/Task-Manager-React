import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userDetails: {name: '', email: ''},
    userTasks: {tasks: []}
  },
  reducers: {
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
    },
    setUserTasks: (state, action) => {
      state.userTasks = action.payload;
    }
  }
});

export const userActions = userSlice.actions;
const userReducer = userSlice.reducer;

export default userReducer;
