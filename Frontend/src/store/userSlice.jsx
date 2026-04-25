import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userDetails: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      profession: '',
      bio: '',
      location: '',
      phone: '',
    },
    userTasks: { tasks: [] },
  },
  reducers: {
    setUserDetails: (state, action) => {
      // Merge new details with existing state to preserve any profile fields
      // that might have been edited but not yet saved to backend
      state.userDetails = { ...state.userDetails, ...action.payload };
    },
    setUserTasks: (state, action) => {
      state.userTasks = action.payload;
    },
    updateTaskTodoList: (state, action) => {
      const { taskId, todoList } = action.payload;
      const taskIndex = state.userTasks.tasks.findIndex(
        (task) => task.id === taskId
      );
      if (taskIndex !== -1) {
        state.userTasks.tasks[taskIndex].todoList = todoList;
      }
    },
    updateTaskTitle: (state, action) => {
      const { taskId, title } = action.payload;
      const taskIndex = state.userTasks.tasks.findIndex(
        (task) => task.id === taskId
      );
      if (taskIndex !== -1) {
        state.userTasks.tasks[taskIndex].title = title;
      }
    },
    updateTaskDescription: (state, action) => {
      const { taskId, description } = action.payload;
      const taskIndex = state.userTasks.tasks.findIndex(
        (task) => task.id === taskId
      );
      if (taskIndex !== -1) {
        state.userTasks.tasks[taskIndex].description = description;
      }
    },
    removeTaskOptimistically: (state, action) => {
      const { taskId } = action.payload;
      state.userTasks.tasks = state.userTasks.tasks.filter(
        (task) => task.id !== taskId
      );
    },
    restoreTask: (state, action) => {
      const { taskId, task } = action.payload;
      if (task) {
        // Check if task already exists (shouldn't happen, but safe)
        const existingIndex = state.userTasks.tasks.findIndex(
          (t) => t.id === taskId
        );
        if (existingIndex === -1) {
          // Add the task back at its original position (or at the end)
          state.userTasks.tasks.push(task);
        } else {
          // Replace existing (shouldn't happen)
          state.userTasks.tasks[existingIndex] = task;
        }
      }
    },
    updateUserDetails: (state, action) => {
      // Accept partial updates to user details
      state.userDetails = { ...state.userDetails, ...action.payload };
    },
  },
});

export const userActions = userSlice.actions;
const userReducer = userSlice.reducer;

export default userReducer;
