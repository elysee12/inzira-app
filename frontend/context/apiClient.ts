import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Local testing IP (from your ipconfig)
const LOCAL_IP = '10.41.233.24';

// Use local IP for testing on your phone, or Render for production
export const BASE_URL = `http://${LOCAL_IP}:3000`;
export const API_URL = `${BASE_URL}/api`;

// export const API_URL = 'https://imirire-app.onrender.com/api';
// export const BASE_URL = 'https://imirire-app.onrender.com';

export const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
