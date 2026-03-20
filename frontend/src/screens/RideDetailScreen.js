import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { rideApi } from '../api/apiClient';
import { useWebSocket } from '../context/WebSocketContext';

export default function RideDetailScreen({ route, navigation }) {
  const { rideId, ride: initialRide } = route.params || {};
  const [ride, setRide] = useState(initialRide || null);
  const [loading, setLoading] = useState(!initialRide);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [decodedPath, setDecodedPath] = useState([]);
  const { subscribe, unsubscribe, connected } = useWebSocket();

  // Fetch ride details if not passed from navigation
  useEffect(() => {
    if (!ride && rideId) {
      rideApi.get(`/rides/${rideId}`)
        .then((res) => setRide(res.data))
        .catch(() => Alert.alert('Error', 'Failed to load ride details'))
        .finally(() => setLoading(false));
    }
  }, [rideId]);

  // Decode polyline when ride loads
  useEffect(() => {
    if (ride?.routePolyline) {
      try {
        const coords = polyline.decode(ride.routePolyline).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setDecodedPath(coords);
      } catch (e) {
        console.error('Polyline decode error:', e);
      }
    }
  }, [ride]);

  // Real-time WebSocket subscription
  useEffect(() => {
    if (!rideId || !connected) return;
    const topic = `/topic/ride/${rideId}`;
    subscribe(topic, (event) => {
      console.log('WS event:', event);
      if (event.type === 'RideJoinedEvent' || event.type === 'JOIN') {
        setRide((prev) => ({
          ...prev,
          availableSeats: Math.max(0, (prev.availableSeats ?? prev.totalSeats ?? 0) - 1),
        }));
      } else if (event.type === 'RideLeftEvent' || event.type === 'LEAVE') {
        setRide((prev) => ({
          ...prev,
          availableSeats: (prev.availableSeats ?? 0) + 1,
        }));
      } else if (event.availableSeats !== undefined) {
        setRide((prev) => ({ ...prev, availableSeats: event.availableSeats }));
      }
    });

    return () => unsubscribe(topic);
  }, [rideId, connected]);

  const handleJoinRide = async () => {
    setJoining(true);
    try {
      await rideApi.post(`/rides/${rideId}/join`);
      Alert.alert('🎉 Joined!', "You've successfully joined this ride. Have a safe trip!", [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join ride. It may be full.';
      Alert.alert('Error', msg);
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRide = async () => {
    setLeaving(true);
    try {
      await rideApi.post(`/rides/${rideId}/leave`);
      Alert.alert('✅ Left Ride', "You've successfully left this ride.", [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to leave ride.';
      Alert.alert('Error', msg);
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const startLat = parseFloat(ride.start_lat || ride.latitude || 28.6139);
  const startLng = parseFloat(ride.start_lng || ride.longitude || 77.209);
  const endLat = parseFloat(ride.end_lat || ride.endLatitude);
  const endLng = parseFloat(ride.end_lng || ride.endLongitude);
  const hasEndCoords = !isNaN(endLat) && !isNaN(endLng);

  const seats = ride.availableSeats ?? ride.seatsAvailable ?? '?';
  const totalSeats = ride.totalSeats ?? '?';
  const seatsNum = typeof seats === 'number' ? seats : parseInt(seats) || 0;
  const isFull = seatsNum === 0;

  const formatDateTime = (str) => {
    if (!str) return 'Not specified';
    try {
      return new Date(str).toLocaleString([], {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return str; }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map Section */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: startLat,
          longitude: startLng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        customMapStyle={lightMapStyle}
      >
        {/* Start marker */}
        <Marker coordinate={{ latitude: startLat, longitude: startLng }} title="Pickup">
          <View style={[styles.markerBox, { backgroundColor: '#1565C0' }]}>
            <Text>🟢</Text>
          </View>
        </Marker>

        {/* End marker */}
        {hasEndCoords && (
          <Marker coordinate={{ latitude: endLat, longitude: endLng }} title="Drop-off">
            <View style={[styles.markerBox, { backgroundColor: '#E53935' }]}>
              <Text>🔴</Text>
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {decodedPath.length > 0 && (
          <Polyline
            coordinates={decodedPath}
            strokeColor="#1565C0"
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Details Sheet */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {/* Route */}
        <View style={styles.routeBlock}>
          <View style={styles.routeDot} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeFrom}>{ride.fromLocation || 'Origin'}</Text>
            <View style={styles.routeLine} />
            <Text style={styles.routeTo}>{ride.toLocation || 'Destination'}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatBox icon="🕐" label="Departure" value={formatDateTime(ride.departureTime)} />
          <StatBox icon="💰" label="Fare" value={`₹${ride.totalFare || ride.fare || '—'}`} />
          <StatBox
            icon="💺"
            label="Seats"
            value={`${seats} / ${totalSeats}`}
            highlight={isFull ? '#FFEBEE' : '#E8F5E9'}
            textColor={isFull ? '#C62828' : '#2E7D32'}
          />
          <StatBox icon="📊" label="Status" value={ride.status || (isFull ? 'FULL' : 'OPEN')} />
        </View>

        {/* Real-time indicator */}
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: connected ? '#4CAF50' : '#FF7043' }]} />
          <Text style={styles.liveText}>
            {connected ? 'Live seat updates active' : 'Real-time disconnected'}
          </Text>
        </View>

        {/* Driver */}
        {ride.driverName && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{ride.driverName[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.driverLabel}>Driver</Text>
              <Text style={styles.driverNameText}>{ride.driverName}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {ride.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>📝 Notes</Text>
            <Text style={styles.notesText}>{ride.notes}</Text>
          </View>
        )}

        {/* Join/Leave Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.joinButton, isFull && styles.joinButtonDisabled, { flex: 1 }]}
            onPress={handleJoinRide}
            disabled={joining || isFull}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>
                {isFull ? '😔 Ride Full' : '🚗 Join'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: '#E53935', flex: 1 }]}
            onPress={handleLeaveRide}
            disabled={leaving}
          >
            {leaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>❌ Leave</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ icon, label, value, highlight, textColor }) {
  return (
    <View style={[styles.statBox, highlight ? { backgroundColor: highlight } : {}]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, textColor ? { color: textColor } : {}]}>{value}</Text>
    </View>
  );
}

const lightMapStyle = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9DCF3' }] },
  { featureType: 'landscape', stylers: [{ color: '#F5F7FF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, color: '#546E7A' },
  errorText: { fontSize: 18, color: '#1A237E', marginTop: 12, fontWeight: '700' },
  map: { height: 240 },
  markerBox: {
    borderRadius: 10, padding: 4,
    borderWidth: 2, borderColor: '#fff',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  sheetContent: { padding: 24, paddingBottom: 40 },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F5F7FF',
    borderRadius: 16,
    padding: 16,
  },
  routeDot: { width: 8, height: 50, backgroundColor: '#1565C0', borderRadius: 4, marginRight: 16 },
  routeInfo: { flex: 1 },
  routeFrom: { fontSize: 16, fontWeight: '800', color: '#1A237E' },
  routeLine: { height: 12, borderLeftWidth: 1, borderLeftColor: '#B0BEC5', marginLeft: -1, marginVertical: 2 },
  routeTo: { fontSize: 15, color: '#546E7A', fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F7FF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#90A4AE', fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1A237E', textAlign: 'center' },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F5F7FF',
    padding: 10,
    borderRadius: 10,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  liveText: { fontSize: 12, color: '#546E7A' },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1565C0',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  driverAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  driverLabel: { fontSize: 11, color: '#90A4AE', fontWeight: '600' },
  driverNameText: { fontSize: 15, color: '#1A237E', fontWeight: '700' },
  notesBlock: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16 },
  notesLabel: { fontSize: 13, fontWeight: '700', color: '#F57F17', marginBottom: 6 },
  notesText: { fontSize: 14, color: '#5D4037', lineHeight: 20 },
  joinButton: {
    backgroundColor: '#1565C0',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#1565C0',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  joinButtonDisabled: { backgroundColor: '#B0BEC5', shadowOpacity: 0 },
  joinButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
