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

  const login = async (username, password) => {
    const response = await authApi.post('/auth/v1/login', { userName: username, password });
    return handleAuthResponse(response.data);
  };

  const googleLogin = async (idToken) => {
    const response = await authApi.post('/auth/v1/google', { idToken });
    return handleAuthResponse(response.data);
  };

  const register = async (name, email, password, phoneNumber, place1, place2) => {
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const response = await authApi.post('/auth/v1/signup', {
      userName: name,
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      place1,
      place2
    });
    return handleAuthResponse(response.data);
  };

  const handleAuthResponse = async (data) => {
    const { accessToken: jwt, token: refreshToken, userName, email: userEmail, phoneNumber, place1, place2 } = data;
    
    // Check if profile is complete (must have a phone number to book/offer rides!)
    const isProfileComplete = !!phoneNumber;
    
    const userData = { 
        name: userName, 
        email: userEmail,
        phoneNumber,
        place1,
        place2,
        isProfileComplete
    };

    await SecureStore.setItemAsync('jwt_token', jwt);
    if (refreshToken) await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return data;
  };

  const completeProfile = async ({ phoneNumber, place1, place2 }) => {
    const response = await authApi.put('/auth/v1/complete-profile', { phoneNumber, place1, place2 });
    
    // Update local user state
    const updatedUserData = {
      ...user,
      phoneNumber: response.data.phoneNumber,
      place1: response.data.place1,
      place2: response.data.place2,
      isProfileComplete: true
    };
    
    await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUserData));
    setUser(updatedUserData);
    return response.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, googleLogin, register, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
