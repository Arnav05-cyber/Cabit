import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <ActivityIndicator size="large" color="#0F172A" />
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
          <Ionicons name="car-sport-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>You haven't offered any rides</Text>
          <Text style={styles.emptySubtitle}>Offer a ride to help fellow students and earn</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('OfferRide')}
          >
            <Text style={styles.emptyButtonText}>Offer a Ride</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
              tintColor="#0F172A"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '500' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
    paddingTop: 60,
  },
  avatarContainer: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  userEmail: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  statPillNum: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statPillLabel: { color: '#94A3B8', fontSize: 12, marginTop: 6, fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 24,
  },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
