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
import DateTimePicker from '@react-native-community/datetimepicker';
import { rideApi } from '../../api/apiClient';

export default function OfferRideScreen({ navigation }) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalSeats, setTotalSeats] = useState('');
  const [totalFare, setTotalFare] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fromLocation.trim() || !toLocation.trim() || !totalSeats || !totalFare) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (isNaN(parseInt(totalSeats)) || parseInt(totalSeats) < 1 || parseInt(totalSeats) > 7) {
      Alert.alert('Invalid Input', 'Seats must be between 1 and 7.');
      return;
    }
    if (isNaN(parseFloat(totalFare)) || parseFloat(totalFare) < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid fare amount.');
      return;
    }
    setLoading(true);
    try {
      await rideApi.post('/rides', {
        fromLocation: fromLocation.trim(),
        toLocation: toLocation.trim(),
        departureTime: departureTime.toISOString(),
        totalSeats: parseInt(totalSeats),
        totalFare: parseFloat(totalFare),
        notes: notes.trim(),
      });
      Alert.alert('🎉 Ride Created!', 'Your ride has been posted successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('FindRides') },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create ride. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>Offer a Ride 🚗</Text>
          <Text style={styles.headerSubtitle}>Share your journey with fellow students</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Route Section */}
          <Text style={styles.sectionTitle}>📍 Route Details</Text>

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
          <Text style={styles.sectionTitle}>🕐 Departure</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <View>
              <Text style={styles.dateLabel}>Departure Time</Text>
              <Text style={styles.dateValue}>
                {departureTime.toLocaleString([], {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={{ marginLeft: 'auto', color: '#1565C0', fontWeight: '700' }}>Change</Text>
          </TouchableOpacity>

          {showDatePicker && (
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
          <Text style={styles.sectionTitle}>🎟️ Ride Info</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={labelStyle}>SEATS AVAILABLE *</Text>
              <TextInput
                style={[inputStyle, { textAlign: 'center' }]}
                placeholder="1–7"
                placeholderTextColor="#B0BEC5"
                keyboardType="number-pad"
                value={totalSeats}
                onChangeText={setTotalSeats}
                maxLength={1}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={labelStyle}>FARE PER PERSON (₹) *</Text>
              <TextInput
                style={[inputStyle, { textAlign: 'center' }]}
                placeholder="e.g. 150"
                placeholderTextColor="#B0BEC5"
                keyboardType="decimal-pad"
                value={totalFare}
                onChangeText={setTotalFare}
              />
            </View>
          </View>

          {/* Notes */}
          <Text style={labelStyle}>ADDITIONAL NOTES</Text>
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="e.g. No smoking, luggage space available..."
            placeholderTextColor="#B0BEC5"
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
                <Text style={{ color: '#fff', fontSize: 18, marginLeft: 8 }}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            💡 Your ride will be visible to verified students on the platform once posted.
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
        placeholderTextColor="#B0BEC5"
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
    color: '#1A237E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#78909C',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1A237E',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: '#546E7A',
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F5F7FF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A237E',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  locationInputContainer: {
    backgroundColor: '#F5F7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginBottom: 16,
  },
  locationInput: {
    padding: 14,
    fontSize: 15,
    color: '#1A237E',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    marginBottom: 16,
  },
  dateIcon: { fontSize: 22, marginRight: 12 },
  dateLabel: { fontSize: 11, color: '#78909C', fontWeight: '700' },
  dateValue: { fontSize: 14, color: '#1A237E', fontWeight: '600', marginTop: 2 },
  row: { flexDirection: 'row' },
  submitButton: {
    backgroundColor: '#1565C0',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1565C0',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 8,
  },
  submitButtonDisabled: { backgroundColor: '#B0BEC5', shadowOpacity: 0 },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  infoBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
  },
  infoBannerText: { fontSize: 13, color: '#1565C0', lineHeight: 18 },
});
