import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { rideApi } from '../api/apiClient';
import RideCard from '../components/RideCard';
import { useAuth } from '../context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FindRidesScreen({ navigation }) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [decodedPath, setDecodedPath] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);

  const fetchRides = useCallback(async () => {
    try {
      const response = await rideApi.get('/rides');
      const data = Array.isArray(response.data) ? response.data : response.data.content || [];
      // Filter out rides created by the current user
      const othersRides = data.filter(r => r.createrId !== user?.name);
      setRides(othersRides);
      setFilteredRides(othersRides);
    } catch (err) {
      Alert.alert('Error', 'Failed to load rides. Please check your connection.');
      console.error('Fetch rides error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Filter rides by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRides(rides);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredRides(
        rides.filter(
          (r) =>
            r.fromLocation?.toLowerCase().includes(q) ||
            r.toLocation?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, rides]);

  const handleSelectRide = (ride) => {
    setSelectedRide(ride);

    // Decode polyline if available
    if (ride.routePolyline) {
      try {
        const coords = polyline.decode(ride.routePolyline).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setDecodedPath(coords);

        // Fit map to show entire route
        if (mapRef.current && coords.length > 0) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }
      } catch (e) {
        console.error('Polyline decode error:', e);
        setDecodedPath([]);
      }
    } else {
      setDecodedPath([]);
      // Just zoom to start location if no polyline
      const startLat = ride.start_lat || ride.latitude;
      const startLng = ride.start_lng || ride.longitude;
      if (mapRef.current && startLat && startLng) {
        mapRef.current.animateToRegion({
          latitude: startLat,
          longitude: startLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 800);
      }
    }
  };

  const getMarkerCoords = (ride) => {
    // Support both naming conventions
    const lat = ride.start_lat || ride.latitude || 28.6139; // fallback to Delhi
    const lng = ride.start_lng || ride.longitude || 77.2090;
    return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
  };

  const getEndCoords = (ride) => {
    const lat = ride.end_lat || ride.endLatitude;
    const lng = ride.end_lng || ride.endLongitude;
    if (lat && lng) return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
    return null;
  };

  const initialRegion = filteredRides.length > 0
    ? { ...getMarkerCoords(filteredRides[0]), latitudeDelta: 0.5, longitudeDelta: 0.5 }
    : { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 1, longitudeDelta: 1 };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Finding rides nearby...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={mapDarkStyle}
        >
          {filteredRides.map((ride) => {
            const coords = getMarkerCoords(ride);
            const isSelected = selectedRide?.rideId === ride.rideId;
            return (
              <Marker
                key={ride.rideId || Math.random().toString()}
                coordinate={coords}
                onPress={() => handleSelectRide(ride)}
                title={ride.fromLocation}
                description={`→ ${ride.toLocation}`}
              >
                <View style={[styles.customMarker, isSelected && styles.selectedMarker]}>
                  <Text style={styles.markerEmoji}>🚗</Text>
                  <Text style={styles.markerFare}>₹{ride.totalFare || ride.fare || '?'}</Text>
                </View>
              </Marker>
            );
          })}

          {/* End marker for selected ride */}
          {selectedRide && getEndCoords(selectedRide) && (
            <Marker
              coordinate={getEndCoords(selectedRide)}
              title={selectedRide.toLocation}
            >
              <View style={[styles.customMarker, { backgroundColor: '#E53935' }]}>
                <Text style={styles.markerEmoji}>📍</Text>
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {decodedPath.length > 0 && (
            <Polyline
              coordinates={decodedPath}
              strokeColor="#42A5F5"
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {/* Map Header Badge */}
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>
            {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>

      {/* List Section */}
      <View style={styles.listSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search from / to location..."
            placeholderTextColor="#90A4AE"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#90A4AE', paddingRight: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredRides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>😔</Text>
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or pull to refresh</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRides}
            keyExtractor={(item) => String(item.rideId)}
            renderItem={({ item }) => (
              <RideCard
                ride={item}
                isSelected={selectedRide?.rideId === item.rideId}
                onPress={() => {
                  handleSelectRide(item);
                  navigation.navigate('RideDetail', { rideId: item.rideId, ride: item });
                }}
                onMapPress={() => handleSelectRide(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchRides();
                }}
                tintColor="#1565C0"
              />
            }
          />
        )}
      </View>
    </View>
  );
}

// Clean map style for a professional look
const mapDarkStyle = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9DCF3' }] },
  { featureType: 'landscape', stylers: [{ color: '#F5F7FF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#EEF1FF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#DBEAFE' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#D1FAE5' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, color: '#546E7A', fontSize: 14 },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.38,
    position: 'relative',
  },
  mapBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(21, 101, 192, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  customMarker: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarker: {
    backgroundColor: '#E53935',
    transform: [{ scale: 1.15 }],
  },
  markerEmoji: { fontSize: 14 },
  markerFare: { color: '#fff', fontSize: 10, fontWeight: '700' },
  listSection: {
    flex: 1,
    backgroundColor: '#F5F7FF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#1A237E' },
  emptyContainer: { alignItems: 'center', paddingTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A237E', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#90A4AE', marginTop: 4 },
});
