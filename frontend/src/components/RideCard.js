import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  AVAILABLE: { bg: '#E8F5E9', text: '#2E7D32' },
  FULL: { bg: '#FFEBEE', text: '#C62828' },
  COMPLETED: { bg: '#ECEFF1', text: '#546E7A' },
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
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoText}>{formatTime(ride.departureTime)}</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>{formatDate(ride.departureTime)}</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoIcon}>💺</Text>
          <Text style={styles.infoText}>{seats} left</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoIcon}>💰</Text>
          <Text style={styles.infoText}>₹{ride.totalFare || ride.fare || '—'}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{status}</Text>
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.mapButton} onPress={onMapPress}>
            <Text style={styles.mapButtonText}>📍 Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton} onPress={onPress}>
            <Text style={styles.viewButtonText}>View →</Text>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#1A237E',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#1565C0',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
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
    backgroundColor: '#1565C0', marginBottom: 2,
  },
  routeLineBar: {
    width: 2, height: 20,
    backgroundColor: '#90CAF9',
  },
  dotTo: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#E53935', marginTop: 2,
  },
  routeLabels: { flex: 1 },
  locationFrom: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
  },
  locationTo: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoIcon: { fontSize: 12, marginRight: 4 },
  infoText: { fontSize: 12, color: '#546E7A', fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  footerRight: { flexDirection: 'row', gap: 8 },
  mapButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  mapButtonText: { fontSize: 12, color: '#1565C0', fontWeight: '600' },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1565C0',
  },
  viewButtonText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1565C0',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  driverName: { fontSize: 13, color: '#546E7A', fontWeight: '600' },
});
