import { createSlice } from '@reduxjs/toolkit';

const commonSlice = createSlice({
  name: 'common',
  initialState: {
    snackbar: { isOpen: false, message: '' },
    errorModal: { isOpen: false, message: '' },
    newTaskModal: { isOpen: false },
    deleteConfirmModal: {
      isOpen: false,
      taskId: null,
      title: '',
      userId: null,
    },
  },
  reducers: {
    openSnackbar: (state, action) => {
      state.snackbar = { isOpen: true, message: action.payload.message };
    },
    closeSnackbar: (state) => {
      state.snackbar = { isOpen: false, message: '' };
    },
    openErrorModal: (state, action) => {
      state.errorModal = { isOpen: true, message: action.payload.message };
    },
    closeErrorModal: (state) => {
      state.errorModal = { isOpen: false, message: '' };
    },
    openNewTaskModal: (state) => {
      state.newTaskModal.isOpen = true;
    },
    closeNewTaskModal: (state) => {
      state.newTaskModal.isOpen = false;
    },
    openDeleteConfirm: (state, action) => {
      state.deleteConfirmModal = {
        isOpen: true,
        taskId: action.payload?.taskId ?? null,
        title: action.payload?.title ?? '',
        userId: action.payload?.userId ?? null,
      };
    },
    closeDeleteConfirm: (state) => {
      state.deleteConfirmModal = {
        isOpen: false,
        taskId: null,
        title: '',
        userId: null,
      };
    },
  },
});

export const commonActions = commonSlice.actions;
const commonReducer = commonSlice.reducer;

export default commonReducer;
