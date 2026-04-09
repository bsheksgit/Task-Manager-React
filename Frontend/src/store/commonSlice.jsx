import { createSlice } from '@reduxjs/toolkit';

const commonSlice = createSlice({
  name: 'common',
  initialState: {
    snackbar: { isOpen: false, message: '', severity: 'success' },
    errorModal: { isOpen: false, message: '' },
    newTaskModal: { isOpen: false },
    deleteConfirmModal: {
      isOpen: false,
      taskId: null,
      title: '',
      userId: null,
    },
    deleteAccountModal: {
      isOpen: false,
      step: 1, // 1 = warning, 2 = credentials, 3 = loading
      error: null,
    },
    subscribeModal: {
      isOpen: false,
      step: 1, // 1 = confirmation, 2 = success
    },
    isDeletingTask: false,
  },
  reducers: {
    openSnackbar: (state, action) => {
      const message = action.payload.message || '';
      const lowerMessage = message.toLowerCase();
      const severity =
        lowerMessage.includes('error') ||
        lowerMessage.includes('failed') ||
        lowerMessage.includes('not found') ||
        lowerMessage.includes('expired') ||
        lowerMessage.includes('cannot') ||
        lowerMessage.includes('limit exceeded') ||
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('wrong') ||
        lowerMessage.includes('incorrect')
          ? 'error'
          : 'success';
      state.snackbar = { isOpen: true, message, severity };
    },
    closeSnackbar: (state) => {
      state.snackbar = { isOpen: false, message: '', severity: 'success' };
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
    startTaskDeletion: (state) => {
      state.isDeletingTask = true;
    },
    finishTaskDeletion: (state) => {
      state.isDeletingTask = false;
    },
    openDeleteAccountModal: (state) => {
      state.deleteAccountModal.isOpen = true;
      state.deleteAccountModal.step = 1;
      state.deleteAccountModal.error = null;
    },
    closeDeleteAccountModal: (state) => {
      state.deleteAccountModal.isOpen = false;
      state.deleteAccountModal.step = 1;
      state.deleteAccountModal.error = null;
    },
    setDeleteAccountModalStep: (state, action) => {
      state.deleteAccountModal.step = action.payload;
      state.deleteAccountModal.error = null;
    },
    setDeleteAccountModalError: (state, action) => {
      state.deleteAccountModal.error = action.payload;
    },
    openSubscribeModal: (state) => {
      state.subscribeModal.isOpen = true;
      state.subscribeModal.step = 1;
    },
    closeSubscribeModal: (state) => {
      state.subscribeModal.isOpen = false;
      state.subscribeModal.step = 1;
    },
    setSubscribeModalStep: (state, action) => {
      state.subscribeModal.step = action.payload;
    },
  },
});

export const commonActions = commonSlice.actions;
const commonReducer = commonSlice.reducer;

export default commonReducer;
