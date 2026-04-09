import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─────────────────────────────────────────────────────────
//  Single entry point — all traffic routes through the
//  Spring Cloud Gateway (port 8080).
//  Change this ONE line when deploying to a different host.
// ─────────────────────────────────────────────────────────
const GATEWAY_BASE = 'http://192.168.1.17:8080';

// Auth Service calls (public — no JWT required)
export const authApi = axios.create({
  baseURL: GATEWAY_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Ride / protected service calls (JWT attached automatically below)
export const rideApi = axios.create({
  baseURL: GATEWAY_BASE,
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

// Response interceptor: handle 401 and attempt token refresh
rideApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          const res = await authApi.post('/auth/v1/refreshToken', { refreshToken });
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.token;
          await SecureStore.setItemAsync('jwt_token', newAccessToken);
          if (newRefreshToken) await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return rideApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, fall through to logout
      }
    }
    
    // If refresh failed or wasn't attempted on a 401
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
    }
    return Promise.reject(error);
  }
);
