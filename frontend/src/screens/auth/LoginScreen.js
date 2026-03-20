import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#1A237E' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Logo / Header */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#42A5F5',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
          }}>
            <Text style={{ fontSize: 36 }}>🚗</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 2 }}>CABIT</Text>
          <Text style={{ color: '#90CAF9', fontSize: 14, marginTop: 4 }}>Student Carpooling</Text>
        </View>

        {/* Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 24,
          padding: 24,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 10,
        }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A237E', marginBottom: 4 }}>Welcome back</Text>
          <Text style={{ fontSize: 14, color: '#78909C', marginBottom: 24 }}>Sign in to your account</Text>

          <Text style={{ fontSize: 12, color: '#546E7A', fontWeight: '600', marginBottom: 6 }}>USERNAME</Text>
          <TextInput
            style={{
              backgroundColor: '#F5F7FF',
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: '#1A237E',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E3F2FD',
            }}
            placeholder="Your username (e.g., Arnav vyas)"
            placeholderTextColor="#B0BEC5"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

          {/* Password */}
          <Text style={{ fontSize: 12, color: '#546E7A', fontWeight: '600', marginBottom: 6 }}>PASSWORD</Text>
          <TextInput
            style={{
              backgroundColor: '#F5F7FF',
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: '#1A237E',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#E3F2FD',
            }}
            placeholder="Enter your password"
            placeholderTextColor="#B0BEC5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: '#1565C0',
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              shadowColor: '#1565C0',
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ textAlign: 'center', color: '#546E7A', fontSize: 14 }}>
              Don't have an account?{' '}
              <Text style={{ color: '#1565C0', fontWeight: '700' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
