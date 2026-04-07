import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  AVAILABLE: { bg: '#F0FDF4', text: '#16A34A' },
  FULL: { bg: '#FEF2F2', text: '#DC2626' },
  COMPLETED: { bg: '#F1F5F9', text: '#64748B' },
};

export default function RideCard({ ride, isSelected, onPress, onMapPress }) {
  const seats = ride.availableSeats ?? ride.seatsAvailable ?? (ride.totalSeats - (ride.occupiedSeats || 0)) ?? '?';
  const status = ride.status || (seats === 0 ? 'FULL' : 'AVAILABLE');
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.AVAILABLE;

  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const formatDate = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, isSelected && styles.selectedCard]}
      activeOpacity={0.85}
    >
      {/* Route Header */}
      <View style={styles.routeRow}>
        <View style={styles.routeLine}>
          <View style={styles.dotFrom} />
          <View style={styles.routeLineBar} />
          <View style={styles.dotTo} />
        </View>
        <View style={styles.routeLabels}>
          <Text style={styles.locationFrom} numberOfLines={1}>{ride.fromLocation || 'Origin'}</Text>
          <Text style={styles.locationTo} numberOfLines={1}>{ride.toLocation || 'Destination'}</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoPill}>
          <Ionicons name="time-outline" size={12} color="#64748B" style={styles.infoIcon} />
          <Text style={styles.infoText}>{formatTime(ride.departureTime)}</Text>
        </View>
        <View style={styles.infoPill}>
          <Ionicons name="calendar-outline" size={12} color="#64748B" style={styles.infoIcon} />
          <Text style={styles.infoText}>{formatDate(ride.departureTime)}</Text>
        </View>
        <View style={styles.infoPill}>
          <Ionicons name="people-outline" size={12} color="#64748B" style={styles.infoIcon} />
          <Text style={styles.infoText}>{seats} left</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.mapButton} onPress={onMapPress}>
            <Ionicons name="location-outline" size={14} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Driver indicator */}
      {ride.driverName && (
        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {ride.driverName[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.driverName}>{ride.driverName}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  selectedCard: {
    borderColor: '#2563EB',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeLine: {
    alignItems: 'center',
    marginRight: 12,
    width: 14,
  },
  dotFrom: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#2563EB', marginBottom: 2,
  },
  routeLineBar: {
    width: 2, height: 20,
    backgroundColor: '#CBD5E1',
  },
  dotTo: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#EF4444', marginTop: 2,
  },
  routeLabels: { flex: 1 },
  locationFrom: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  locationTo: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoIcon: { marginRight: 6 },
  infoText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  footerRight: { flexDirection: 'row', gap: 8 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  mapButtonText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  viewButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  driverName: { fontSize: 13, color: '#475569', fontWeight: '600' },
});
