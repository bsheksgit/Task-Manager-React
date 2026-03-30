import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userDetails: { name: '', email: '' },
    userTasks: { tasks: [] },
  },
  reducers: {
    setUserDetails: (state, action) => {
      state.userDetails = action.payload;
    },
    setUserTasks: (state, action) => {
      state.userTasks = action.payload;
    },
    updateTaskTodoList: (state, action) => {
      const { taskId, todoList } = action.payload;
      const taskIndex = state.userTasks.tasks.findIndex(
        (task) => task._id === taskId
      );
      if (taskIndex !== -1) {
        state.userTasks.tasks[taskIndex].todoList = todoList;
      }
    },
    updateTaskTitle: (state, action) => {
      const { taskId, title } = action.payload;
      const taskIndex = state.userTasks.tasks.findIndex(
        (task) => task._id === taskId
      );
      if (taskIndex !== -1) {
        state.userTasks.tasks[taskIndex].title = title;
      }
    },
    updateTaskDescription: (state, action) => {
      const { taskId, description } = action.payload;
      const taskIndex = state.userTasks.tasks.findIndex(
        (task) => task._id === taskId
      );
      if (taskIndex !== -1) {
        state.userTasks.tasks[taskIndex].description = description;
      }
    },
  },
});

export const userActions = userSlice.actions;
const userReducer = userSlice.reducer;

export default userReducer;
