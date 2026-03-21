import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { rideApi } from '../api/apiClient';
import RideCard from '../components/RideCard';
import { useAuth } from '../context/AuthContext';

import { useFocusEffect } from '@react-navigation/native';

export default function MyBookingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const offeredRes = await rideApi.get('/rides/my/offered');
      const offered = Array.isArray(offeredRes.data) ? offeredRes.data : offeredRes.data?.content || [];
      setBookings(offered);
    } catch (err) {
      try {
        const response = await rideApi.get('/rides');
        const all = Array.isArray(response.data) ? response.data : response.data?.content || [];
        // Filter those created by user as fallback
        const myOffered = all.filter(r => r.createrId === user?.name || r.creatorName === user?.name);
        setBookings(myOffered);
      } catch {
        Alert.alert('Error', 'Failed to load your bookings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statPillNum}>{bookings.length || 0}</Text>
          <Text style={styles.statPillLabel}>Rides Offered</Text>
        </View>
      </View>

      {/* Rides List */}
      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 52 }}>🚗</Text>
          <Text style={styles.emptyTitle}>You haven't offered any rides</Text>
          <Text style={styles.emptySubtitle}>Offer a ride to help fellow students and earn</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('OfferRide')}
          >
            <Text style={styles.emptyButtonText}>Offer a Ride →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RideCard
              ride={item}
              isSelected={false}
              onPress={() => navigation.navigate('RideDetail', { rideId: item.id, ride: item })}
              onMapPress={() => navigation.navigate('FindRides')}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(); }}
              tintColor="#1565C0"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FF' },
  loadingText: { marginTop: 12, color: '#546E7A' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A237E',
    padding: 20,
    paddingTop: 50,
  },
  avatarContainer: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#42A5F5',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  userEmail: { color: '#90CAF9', fontSize: 13, marginTop: 2 },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statPillNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statPillLabel: { color: '#90CAF9', fontSize: 12, marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#E8EEF9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: { backgroundColor: '#fff', shadowColor: '#1A237E', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: '#78909C', fontWeight: '600' },
  activeTabText: { color: '#1A237E', fontWeight: '800' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A237E', marginTop: 14 },
  emptySubtitle: { fontSize: 14, color: '#90A4AE', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  emptyButton: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
