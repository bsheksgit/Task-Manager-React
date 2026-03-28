import axios from 'axios';
import store from '../store/index';
import { loginModalActions } from '../store/loginSlice.jsx';
import { commonActions } from '../store/commonSlice.jsx';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Update with your backend URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: Add token to requests except auth endpoints
apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAuthEndpoint =
      url.endsWith('/login') ||
      url.endsWith('/signup') ||
      url.includes('/login') ||
      url.includes('/signup');
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (token expired/invalid), ignore auth endpoints
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint =
      url.endsWith('/login') ||
      url.endsWith('/signup') ||
      url.includes('/login') ||
      url.includes('/signup');
    if (status === 401 && !isAuthEndpoint) {
      // Token expired or invalid - use the Redux logout reducer to clear auth state and storage
      try {
        store.dispatch(loginModalActions.logout());
      } catch (e) {
        // Fallback to manual clear if dispatch fails for some reason
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      console.warn('Token expired. User has been logged out via Redux action.');
      // Redirect to home/login page and show a snackbar via Redux store
      try {
        window.location.href = '/';
      } catch {}
      try {
        store.dispatch(
          commonActions.openSnackbar({
            message: 'Session expired. Please log in again.',
          })
        );
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export const apiHelper = {
  registerUser: async (userData) => {
    try {
      const response = await apiClient.post('/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  loginUser: async (data) => {
    try {
      const response = await apiClient.post('/login', data);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  saveUserTasks: async (userId, tasks) => {
    try {
      const payload = { userId, tasks };
      const response = await apiClient.post('/save-user-tasks', payload);
      return response.data;
    } catch (error) {
      console.error('Error saving user tasks:', error);
      throw error;
    }
  },
  getUserTasks: async (userId) => {
    try {
      const response = await apiClient.get('/get-user-tasks', {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  },
  getUserTask: async (userId, taskId) => {
    try {
      const response = await apiClient.get(`/users/${userId}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user task:', error);
      throw error;
    }
  },
  deleteUserTask: async (userId, taskId) => {
    try {
      const response = await apiClient.delete('/delete-user-task', {
        params: { userId, taskId },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user task:', error);
      throw error;
    }
  },
};
