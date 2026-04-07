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
import { Ionicons } from '@expo/vector-icons';
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
      console.log("Registration Error:", err);
      const data = err.response?.data;
      
      let msg = 'Registration failed. Please try again.';
      if (typeof data === 'object' && data?.message) {
        msg = data.message;
      } else if (typeof data === 'string' && data) {
        msg = data;
      } else if (err.message) {
        msg = `Network/System Error: ${err.message}`;
      }

      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  };

  const labelStyle = { fontSize: 12, color: '#475569', fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 36, marginTop: 24 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 16,
            backgroundColor: '#0F172A',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="school" size={32} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#0F172A', fontSize: 28, fontWeight: '800', letterSpacing: 1 }}>CABIT</Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Join the student network</Text>
        </View>

        {/* Card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>Create Account</Text>
          <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Sign up with your university email</Text>

          <Text style={labelStyle}>FULL NAME</Text>
          <TextInput
            style={inputStyle}
            placeholder="Your full name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />

          <Text style={labelStyle}>EMAIL</Text>
          <TextInput
            style={inputStyle}
            placeholder="your@university.edu"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={labelStyle}>PHONE NUMBER</Text>
          <TextInput
            style={inputStyle}
            placeholder="Your phone number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={labelStyle}>MOST VISITED PLACE 1</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Home, Hostel"
            placeholderTextColor="#94A3B8"
            value={place1}
            onChangeText={setPlace1}
          />

          <Text style={labelStyle}>MOST VISITED PLACE 2</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. Campus, Work"
            placeholderTextColor="#94A3B8"
            value={place2}
            onChangeText={setPlace2}
          />

          <Text style={labelStyle}>PASSWORD</Text>
          <TextInput
            style={inputStyle}
            placeholder="Create a password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: -10, marginBottom: 14 }}>
            Must include uppercase, lowercase, digit & special char (!@#$%^&*()-+)
          </Text>

          <Text style={labelStyle}>CONFIRM PASSWORD</Text>
          <TextInput
            style={inputStyle}
            placeholder="Confirm your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: '#2563EB',
              borderRadius: 10,
              padding: 14,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#64748B', fontSize: 14 }}>
              Already have an account?{' '}
              <Text style={{ color: '#2563EB', fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
