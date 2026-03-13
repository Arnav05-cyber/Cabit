import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URLs for different services
export const AUTH_BASE = 'http://localhost:8081';
export const RIDE_BASE = 'http://localhost:8082';
export const NOTIF_BASE = 'http://localhost:8084';

// Auth Service instance
export const authApi = axios.create({
  baseURL: AUTH_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Ride Service instance
export const rideApi = axios.create({
  baseURL: RIDE_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attaches JWT token to every ride API request
rideApi.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: logout on 401 Unauthorized
rideApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
    }
    return Promise.reject(error);
  }
);
