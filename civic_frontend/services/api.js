// services/api.js
import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

// Configure the API base URL
const API_BASE_URL = 'http://10.0.2.2:8000'; // Use 10.0.2.2 for Android emulator or your machine's IP for physical device

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the error is 401 (Unauthorized), remove the token
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized request. Logging out user...');
      await removeToken();
      // Optionally, you can emit an event or dispatch a Redux action to update state
      // For this app, the App.js state will handle this gracefully on next render.
    }
    return Promise.reject(error);
  }
);

export default api;