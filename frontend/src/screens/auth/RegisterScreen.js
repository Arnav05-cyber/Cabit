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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [place1, setPlace1] = useState('');
  const [place2, setPlace2] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phoneNumber.trim() || !place1.trim() || !place2.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', "Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, phoneNumber.trim(), place1.trim(), place2.trim());
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#F5F7FF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A237E',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  };

  const labelStyle = { fontSize: 12, color: '#546E7A', fontWeight: '600', marginBottom: 6 };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#1A237E' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <View style={{
            width: 70, height: 70, borderRadius: 35,
            backgroundColor: '#42A5F5',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 30 }}>🎓</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 2 }}>CABIT</Text>
          <Text style={{ color: '#90CAF9', fontSize: 13, marginTop: 4 }}>Join the student carpool network</Text>
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
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1A237E', marginBottom: 4 }}>Create Account</Text>
          <Text style={{ fontSize: 14, color: '#78909C', marginBottom: 24 }}>Sign up with your university email</Text>

          <Text style={labelStyle}>FULL NAME</Text>
          <TextInput
            style={inputStyle}
            placeholder="Your full name"
            placeholderTextColor="#B0BEC5"
            value={name}
            onChangeText={setName}
          />

          <Text style={labelStyle}>EMAIL</Text>
          <TextInput
            style={inputStyle}
            placeholder="your@university.edu"
            placeholderTextColor="#B0BEC5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={labelStyle}>PHONE NUMBER</Text>
          <TextInput
            style={inputStyle}
            placeholder="Your phone number"
            placeholderTextColor="#B0BEC5"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={labelStyle}>MOST VISITED PLACE 1</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Home, Hostel"
            placeholderTextColor="#B0BEC5"
            value={place1}
            onChangeText={setPlace1}
          />

          <Text style={labelStyle}>MOST VISITED PLACE 2</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Campus, Work"
            placeholderTextColor="#B0BEC5"
            value={place2}
            onChangeText={setPlace2}
          />

          <Text style={labelStyle}>PASSWORD</Text>
          <TextInput
            style={inputStyle}
            placeholder="Create a password"
            placeholderTextColor="#B0BEC5"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={labelStyle}>CONFIRM PASSWORD</Text>
          <TextInput
            style={inputStyle}
            placeholder="Confirm your password"
            placeholderTextColor="#B0BEC5"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            onPress={handleRegister}
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ textAlign: 'center', color: '#546E7A', fontSize: 14 }}>
              Already have an account?{' '}
              <Text style={{ color: '#1565C0', fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
