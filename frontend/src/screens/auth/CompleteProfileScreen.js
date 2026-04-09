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

export default function CompleteProfileScreen({ navigation }) {
  const { completeProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [place1, setPlace1] = useState('');
  const [place2, setPlace2] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber.trim() || !place1.trim() || !place2.trim()) {
      Alert.alert('Error', 'Please fill in all fields to continue');
      return;
    }
    
    setLoading(true);
    try {
      await completeProfile({
        phoneNumber: phoneNumber.trim(),
        place1: place1.trim(),
        place2: place2.trim()
      });
      // App.js RootNavigator will automatically route to MainTabs once profile finishes
    } catch (err) {
      console.log('Profile Completion Error:', err);
      Alert.alert('Error', 'Failed to save profile details. Please try again.');
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
            <Ionicons name="person-add" size={32} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#0F172A', fontSize: 24, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' }}>
            Almost there!
          </Text>
          <Text style={{ color: '#64748B', fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 }}>
            We just need a few more details to set up your CABIT profile.
          </Text>
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
          
          <Text style={labelStyle}>PHONE NUMBER</Text>
          <TextInput
            style={inputStyle}
            placeholder="Your contact number"
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

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: '#2563EB',
              borderRadius: 10,
              padding: 14,
              alignItems: 'center',
              marginTop: 8,
              shadowColor: '#2563EB',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Save & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
