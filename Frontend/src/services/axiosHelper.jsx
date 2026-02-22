import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Update with your backend URL

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

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

loginUser: async (email, password) => {
    try {
        const response = await apiClient.post('/login', { email, password });
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}
}