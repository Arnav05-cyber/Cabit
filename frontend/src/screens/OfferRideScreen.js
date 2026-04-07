import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { rideApi } from '../api/apiClient';

export default function OfferRideScreen({ navigation }) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalSeats, setTotalSeats] = useState('');

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fromLocation.trim() || !toLocation.trim() || !totalSeats) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (isNaN(parseInt(totalSeats)) || parseInt(totalSeats) < 1 || parseInt(totalSeats) > 7) {
      Alert.alert('Invalid Input', 'Seats must be between 1 and 7.');
      return;
    }

    setLoading(true);
    try {
      await rideApi.post('/rides', {
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        departureTime: departureTime.toISOString(),
        totalSeats: parseInt(totalSeats),

        notes: notes.trim(),
      });
      Alert.alert('🎉 Ride Created!', 'Your ride has been posted successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('FindRides') },
      ]);
    } catch (err) {
      console.error('=== RIDE CREATE ERROR ===');
      console.error('Status:', err.response?.status);
      console.error('Data:', JSON.stringify(err.response?.data));
      console.error('Message:', err.message);
      console.error('Is network error:', !err.response);
      const msg = err.response?.data?.message || err.message || 'Failed to create ride. Please try again.';
      Alert.alert('Error', `[${err.response?.status || 'NETWORK'}] ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: departureTime,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setDepartureTime(selectedDate);
            // Open time picker right after date is selected
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              onChange: (tEvent, tDate) => {
                if (tEvent.type === 'set' && tDate) {
                  setDepartureTime(tDate);
                }
              },
            });
          }
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const inputStyle = styles.input;
  const labelStyle = styles.label;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F7FF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Offer a Ride</Text>
          <Text style={styles.headerSubtitle}>Share your journey with fellow students</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Route Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#0F172A" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Route Details</Text>
          </View>

          <Text style={labelStyle}>FROM *</Text>
          <LocationInput
            value={fromLocation}
            onChange={setFromLocation}
            placeholder="Pickup location (e.g., IIT Delhi Main Gate)"
          />

          <Text style={labelStyle}>TO *</Text>
          <LocationInput
            value={toLocation}
            onChange={setToLocation}
            placeholder="Drop-off location (e.g., Connaught Place)"
          />

          {/* Departure Time */}
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#0F172A" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Departure</Text>
          </View>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={handleOpenPicker}
          >
            <Ionicons name="calendar-outline" size={22} color="#64748B" style={styles.dateIcon} />
            <View>
              <Text style={styles.dateLabel}>Departure Time</Text>
              <Text style={styles.dateValue}>
                {departureTime.toLocaleString([], {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={{ marginLeft: 'auto', color: '#2563EB', fontWeight: '700' }}>Change</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={departureTime}
              mode="datetime"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setDepartureTime(date);
              }}
            />
          )}

          {/* Ride Details */}
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#0F172A" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Ride Info</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={labelStyle}>SEATS AVAILABLE *</Text>
              <TextInput
                style={[inputStyle, { textAlign: 'center' }]}
                placeholder="1–7"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={totalSeats}
                onChangeText={setTotalSeats}
                maxLength={1}
              />
            </View>

          </View>

          {/* Notes */}
          <Text style={labelStyle}>ADDITIONAL NOTES</Text>
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="e.g. No smoking, luggage space available..."
            placeholderTextColor="#94A3B8"
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Post Ride</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={20} color="#2563EB" style={{ marginRight: 10, marginTop: 2 }} />
          <Text style={styles.infoBannerText}>
            Your ride will be visible to verified students on the platform once posted.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Simple location input with suggestions styling
function LocationInput({ value, onChange, placeholder }) {
  return (
    <View style={styles.locationInputContainer}>
      <TextInput
        style={styles.locationInput}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationInputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  locationInput: {
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  dateIcon: { marginRight: 12 },
  dateLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  dateValue: { fontSize: 14, color: '#0F172A', fontWeight: '600', marginTop: 2 },
  row: { flexDirection: 'row' },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerText: { flex: 1, fontSize: 13, color: '#1E3A8A', lineHeight: 20 },
});
