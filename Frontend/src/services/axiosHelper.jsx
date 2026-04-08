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

      // Store session expiration flag in localStorage before navigating
      try {
        localStorage.setItem('sessionExpired', 'true');
      } catch (e) {}

      // Navigate to logout page which will show appropriate message and then redirect to welcome page
      setTimeout(() => {
        try {
          window.location.href = '/logout';
        } catch {}
      }, 100); // Short delay
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
      const payload = { tasks };
      const response = await apiClient.post(`/users/${userId}/tasks`, payload);
      return response.data;
    } catch (error) {
      console.error('Error saving user tasks:', error);
      throw error;
    }
  },
  getUserTasks: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}/tasks`);
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
  saveUserTask: async (userId, taskId, taskData) => {
    try {
      const response = await apiClient.post(
        `/users/${userId}/tasks/${taskId}`,
        taskData
      );
      return response.data;
    } catch (error) {
      console.error('Error saving user task:', error);
      throw error;
    }
  },
  deleteUserTask: async (userId, taskId) => {
    try {
      const response = await apiClient.delete(
        `/users/${userId}/tasks/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting user task:', error);
      throw error;
    }
  },

  getUserProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, profileData) => {
    try {
      const response = await apiClient.put(
        `/users/${userId}/profile`,
        profileData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  uploadProfilePicture: async (userId, formData) => {
    try {
      const response = await apiClient.post(
        `/users/${userId}/profile/picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  },

  deleteProfilePicture: async (userId) => {
    try {
      const response = await apiClient.delete(
        `/users/${userId}/profile/picture`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      throw error;
    }
  },

  deleteUser: async (userId, password, confirmationText) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`, {
        data: { password, confirmationText },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};
