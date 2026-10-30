import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { fetchBookings, type BookingRecord } from '@/lib/booking';
import { formatBookingDate, formatBookingSlot } from '@/lib/tanggal';

export default function HistoryScreen() {
  const [bookings, setBookings] = useState<BookingRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tableWidth, setTableWidth] = useState(0);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    fetchBookings()
      .then((next) => {
        if (requestId.current !== id) {
          return;
        }
        setBookings(next);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (requestId.current !== id) {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Antrian tidak dapat dimuat');
        setBookings((current) => current ?? []);
      });
    return () => {
      if (requestId.current === id) {
        requestId.current += 1;
      }
    };
  }, []);

  useFocusEffect(load);

  const rowWidth = tableWidth > 32 ? tableWidth - 32 : undefined;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        onLayout={(event) => setTableWidth(event.nativeEvent.layout.width)}>
        <View style={[styles.headerRow, rowWidth ? { width: rowWidth } : null]}>
          <Text style={[styles.headerCell, styles.date]}>Tanggal Antri</Text>
          <Text style={[styles.headerCell, styles.session]}>Sesi</Text>
          <Text style={[styles.headerCell, styles.status]}>Status</Text>
        </View>
        {error ? (
          <View style={styles.messageBlock}>
            <Text style={styles.error}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} style={styles.reload}>
              <Text style={styles.reloadText}>Muat ulang</Text>
            </Pressable>
          </View>
        ) : null}
        {bookings === null ? <Text style={styles.message}>Memuat antrian...</Text> : null}
        {bookings !== null && bookings.length === 0 && !error ? (
          <Text style={styles.message}>Belum ada antrian.</Text>
        ) : null}
        {bookings?.map((item) => (
          <View key={item.id} style={[styles.row, rowWidth ? { width: rowWidth } : null]}>
            <Text style={[styles.cell, styles.date]}>{formatBookingDate(item.bookingTime)}</Text>
            <Text style={[styles.cell, styles.session]}>{formatBookingSlot(item.bookingSlot)}</Text>
            <View style={styles.status}>
              <StatusLabel status={bookingStatus(item)} verified={item.verified} />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function bookingStatus(item: BookingRecord) {
  if (item.verified) {
    return 'OK';
  }
  return item.unverifiedStatus ?? 'Pending';
}

function StatusLabel({ status, verified }: { status: string; verified: boolean }) {
  return (
    <View style={[styles.badge, verified ? styles.badgeVerified : styles.badgePending]}>
      <Text style={[styles.badgeText, verified ? styles.badgeTextVerified : styles.badgeTextPending]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E7EE',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E7EE',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C2430',
  },
  cell: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1C2430',
  },
  date: {
    flexGrow: 0.9,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  session: {
    flexGrow: 1.05,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  status: {
    flexGrow: 1.35,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  badge: {
    width: '100%',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePending: {
    backgroundColor: '#FDE8EB',
  },
  badgeVerified: {
    backgroundColor: '#E5F6EA',
  },
  badgeText: {
    width: '100%',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  badgeTextPending: {
    color: '#9B2335',
  },
  badgeTextVerified: {
    color: '#1B7A3A',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#3F4A5A',
  },
  messageBlock: {
    marginTop: 12,
    gap: 8,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9B2335',
  },
  reload: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  reloadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
