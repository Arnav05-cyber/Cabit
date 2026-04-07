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
import { Ionicons } from '@expo/vector-icons';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'nearby'
  const mapRef = useRef(null);

  const fetchRides = useCallback(async () => {
    try {
      const endpoint = activeTab === 'nearby' ? '/rides/nearby' : '/rides';
      const response = await rideApi.get(endpoint);
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
  }, [activeTab, user]);

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
        <ActivityIndicator size="large" color="#0F172A" />
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
          // Using default allows native iOS/Android to pick the best provider without issues
          // Removed customMapStyle which can cause the black screen on iOS non-Google maps
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
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
                  <Ionicons name="car" size={16} color="#FFFFFF" />
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
              <View style={[styles.customMarker, { backgroundColor: '#EF4444', borderColor: '#FFFFFF' }]}>
                <Ionicons name="flag" size={12} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Route Polyline */}
          {decodedPath.length > 0 && (
            <Polyline
              coordinates={decodedPath}
              strokeColor="#2563EB"
              strokeWidth={3}
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
        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All Rides
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
            onPress={() => setActiveTab('nearby')}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
              Near My Places
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search from / to location..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {filteredRides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or pull down to refresh</Text>
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
                tintColor="#0F172A"
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '500' },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.38,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0', // Shows while map loads
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapBadge: {
    position: 'absolute',
    top: 50, // Pushed down to clear notch if any
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  mapBadgeText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12, letterSpacing: 0.5 },
  customMarker: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMarker: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.2 }],
    zIndex: 1,
  },

  listSection: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  activeTabText: { color: '#0F172A', fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 48, fontSize: 14, color: '#0F172A', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
