import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';
import { Alert } from 'react-native';

// Configure base URL - change this for production
const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      // Force app restart to show login screen
      Alert.alert('Session Expired', 'Please log in again', [
        { text: 'OK', onPress: () => {
          // In a real app, you might want to use navigation here
          // or emit an event to force re-authentication
        }}
      ]);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (username, password) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

export const register = async (username, password) => {
  try {
    const response = await api.post('/auth/register', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};

// Report endpoints
export const uploadReport = async ({ text, latitude, longitude, category, image }) => {
  try {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('category', category);

    if (image) {
      const imageUri = image.uri;
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      });
    }

    const response = await api.post('/api/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to upload report');
  }
};

export const getMyReports = async () => {
  try {
    const response = await api.get('/api/reports/my');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch reports');
  }
};

export const getAllReports = async () => {
  try {
    const response = await api.get('/api/reports/all');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch reports');
  }
};