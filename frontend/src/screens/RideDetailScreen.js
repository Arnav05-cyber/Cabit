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
import { Ionicons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import { rideApi } from '../api/apiClient';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export default function RideDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { rideId, ride: initialRide } = route.params || {};
  const [ride, setRide] = useState(initialRide || null);
  const [loading, setLoading] = useState(!initialRide);
  const [decodedPath, setDecodedPath] = useState([]);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      if (event.availableSeats !== undefined) {
        setRide((prev) => ({ ...prev, availableSeats: event.availableSeats }));
      }
    });

    return () => unsubscribe(topic);
  }, [rideId, connected]);

  const handleCloseRide = async () => {
    Alert.alert('Close Ride', 'Are you sure you want to close this ride? No more passengers will be able to join.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        setClosing(true);
        try {
          await rideApi.put(`/rides/${rideId}/close`);
          setRide((prev) => ({ ...prev, status: 'CLOSED', rideStatus: 'CLOSED' }));
          Alert.alert('Closed', 'The ride has been closed.');
        } catch (err) {
          Alert.alert('Error', 'Failed to close ride.');
        } finally {
          setClosing(false);
        }
      }}
    ]);
  };

  const handleDeleteRide = async () => {
    Alert.alert('Delete Ride', 'Are you sure you want to delete this ride? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await rideApi.delete(`/rides/${rideId}`);
          Alert.alert('Deleted', 'The ride has been deleted.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch (err) {
          Alert.alert('Error', 'Failed to delete ride.');
          setDeleting(false);
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
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
      >
        {/* Start marker */}
        <Marker coordinate={{ latitude: startLat, longitude: startLng }} title="Pickup">
          <View style={[styles.markerBox, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="car" size={14} color="#FFFFFF" />
          </View>
        </Marker>

        {/* End marker */}
        {hasEndCoords && (
          <Marker coordinate={{ latitude: endLat, longitude: endLng }} title="Drop-off">
            <View style={[styles.markerBox, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="flag" size={14} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {decodedPath.length > 0 && (
          <Polyline
            coordinates={decodedPath}
            strokeColor="#2563EB"
            strokeWidth={4}
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
          <StatBox icon="time-outline" label="Departure" value={formatDateTime(ride.departureTime)} />
          <StatBox
            icon="people-outline"
            label="Seats"
            value={`${seats} / ${totalSeats}`}
            highlight={isFull ? '#FEF2F2' : '#F0FDF4'}
            textColor={isFull ? '#DC2626' : '#16A34A'}
          />
          <StatBox icon="options-outline" label="Status" value={ride.status === 'CLOSED' || ride.rideStatus === 'CLOSED' ? 'CLOSED' : (isFull ? 'FULL' : 'OPEN')} />
        </View>

        {/* Real-time indicator */}
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: connected ? '#4CAF50' : '#FF7043' }]} />
          <Text style={styles.liveText}>
            {connected ? 'Live seat updates active' : 'Real-time disconnected'}
          </Text>
        </View>

        {/* Driver */}
        {ride.creatorName && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{ride.creatorName[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverLabel}>Creator</Text>
              <Text style={styles.driverNameText}>{ride.creatorName}</Text>
            </View>
            {ride.creatorPhone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => Alert.alert('Contact Creator', `Phone: ${ride.creatorPhone}`)}
              >
                <Ionicons name="call" size={16} color="#16A34A" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        {ride.notes && (
          <View style={styles.notesBlock}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="document-text-outline" size={16} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.notesLabel}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{ride.notes}</Text>
          </View>
        )}

        {/* Creator Actions */}
        {user?.name === ride.createrId && (
          <View style={styles.actionRow}>
            {(ride.status !== 'CLOSED' && ride.rideStatus !== 'CLOSED') && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                onPress={handleCloseRide}
                disabled={closing}
              >
                {closing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionButtonText}>Close Ride</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={handleDeleteRide}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ icon, label, value, highlight, textColor }) {
  return (
    <View style={[styles.statBox, highlight ? { backgroundColor: highlight } : {}]}>
      <Ionicons name={icon} size={22} color={textColor || "#64748B"} style={styles.statIcon} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, textColor ? { color: textColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '500' },
  errorText: { fontSize: 18, color: '#0F172A', marginTop: 12, fontWeight: '700' },
  map: { height: 260, backgroundColor: '#E2E8F0' },
  markerBox: {
    borderRadius: 10, padding: 6,
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
  },
  sheetContent: { padding: 24, paddingBottom: 40 },
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeDot: { width: 4, height: 40, backgroundColor: '#2563EB', borderRadius: 4, marginRight: 16 },
  routeInfo: { flex: 1 },
  routeFrom: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  routeLine: { height: 12, borderLeftWidth: 1, borderLeftColor: '#CBD5E1', marginLeft: 0, marginVertical: 4 },
  routeTo: { fontSize: 15, color: '#475569', fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: { marginBottom: 6 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  liveText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  driverAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  driverLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  driverNameText: { fontSize: 16, color: '#0F172A', fontWeight: '700', marginTop: 2 },
  notesBlock: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  notesLabel: { fontSize: 12, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontSize: 14, color: '#92400E', lineHeight: 22, marginTop: 4 },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  callButtonText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});
