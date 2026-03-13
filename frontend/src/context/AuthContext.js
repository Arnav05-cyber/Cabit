import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stored token on mount
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('jwt_token');
        const storedUser = await SecureStore.getItemAsync('user_data');
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.log('Failed to load token:', e);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.post('/auth/login', { email, password });
    const { token: jwt, ...userData } = response.data;
    await SecureStore.setItemAsync('jwt_token', jwt);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await authApi.post('/auth/register', { name, email, password });
    const { token: jwt, ...userData } = response.data;
    await SecureStore.setItemAsync('jwt_token', jwt);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return response.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
