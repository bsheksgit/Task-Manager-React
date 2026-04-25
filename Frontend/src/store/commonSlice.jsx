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
      attemptsRemaining: 3, // Track remaining password attempts
      isLocked: false, // 24-hour lockout flag
      lockoutUntil: null, // Lockout timestamp
    },
    subscribeModal: {
      isOpen: false,
      step: 1, // 1 = confirmation, 2 = success
    },
    isDeletingTask: false,
  },
  reducers: {
    openSnackbar: (state, action) => {
      // Ensure message is a string
      let message = '';
      if (action.payload && typeof action.payload === 'object') {
        message = action.payload.message || '';
      } else if (typeof action.payload === 'string') {
        message = action.payload;
      }

      // Convert to string and lowercase for severity detection
      const messageStr = String(message);
      const lowerMessage = messageStr.toLowerCase();
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
      state.snackbar = { isOpen: true, message: messageStr, severity };
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
    setDeleteAccountModalAttempts: (state, action) => {
      state.deleteAccountModal.attemptsRemaining = action.payload;
    },
    setDeleteAccountModalLockout: (state, action) => {
      state.deleteAccountModal.isLocked = action.payload.isLocked;
      state.deleteAccountModal.lockoutUntil = action.payload.lockoutUntil;
      if (action.payload.isLocked) {
        state.deleteAccountModal.attemptsRemaining = 0;
      }
    },
    decrementDeleteAccountAttempts: (state) => {
      state.deleteAccountModal.attemptsRemaining = Math.max(
        0,
        state.deleteAccountModal.attemptsRemaining - 1
      );
    },
    processDeleteAccountError: (state, action) => {
      // Handle structured error from backend
      const { attempts_remaining, is_locked, lockout_until } = action.payload;

      if (attempts_remaining !== undefined) {
        state.deleteAccountModal.attemptsRemaining = attempts_remaining;
      }
      if (is_locked !== undefined) {
        state.deleteAccountModal.isLocked = is_locked;
      }
      if (lockout_until !== undefined) {
        state.deleteAccountModal.lockoutUntil = lockout_until;
      }
    },
    resetDeleteAccountModalAttempts: (state) => {
      state.deleteAccountModal.attemptsRemaining = 3;
      state.deleteAccountModal.isLocked = false;
      state.deleteAccountModal.lockoutUntil = null;
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
