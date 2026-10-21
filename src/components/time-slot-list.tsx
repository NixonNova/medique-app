import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WorkingDayTimeSlot } from '@/lib/booking';

type TimeSlotListProps = {
  slots: WorkingDayTimeSlot[];
  loading: boolean;
  error: string | null;
  selectedKey: string | null;
  onSelect: (slot: WorkingDayTimeSlot) => void;
  onReload: () => void;
};

export function timeSlotKey(slot: Pick<WorkingDayTimeSlot, 'start' | 'end'>) {
  return `${slot.start}|${slot.end}`;
}

export function TimeSlotList({ slots, loading, error, selectedKey, onSelect, onReload }: TimeSlotListProps) {
  if (loading) {
    return <Text style={styles.message}>Memuat jadwal...</Text>;
  }

  if (error) {
    return (
      <View style={styles.messageBlock}>
        <Text style={styles.error}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={onReload} style={styles.reload}>
          <Text style={styles.reloadText}>Muat ulang</Text>
        </Pressable>
      </View>
    );
  }

  if (slots.length === 0) {
    return <Text style={styles.message}>Tidak ada jadwal pada tanggal ini.</Text>;
  }

  return (
    <View style={styles.list}>
      {slots.map((slot) => {
        const key = timeSlotKey(slot);
        const selected = key === selectedKey;
        return (
          <View key={key} style={[styles.card, selected ? styles.cardSelected : null]}>
            <View style={styles.top}>
              <View style={styles.timeBlock}>
                <Text style={styles.meta}>Waktu</Text>
                <Text style={styles.time}>{slot.timeLabel}</Text>
              </View>
              {slot.available ? (
                <Pressable
                  accessibilityLabel={`Pilih jam ${slot.timeLabel}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(slot)}
                  style={[styles.pick, selected ? styles.pickSelected : null]}>
                  <Text style={[styles.pickText, selected ? styles.pickTextSelected : null]}>Pilih</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.block}>
              <Text style={styles.meta}>Dokter</Text>
              <Text style={styles.value}>{slot.practitionerName ?? '—'}</Text>
            </View>
            {slot.patients.length > 0 ? (
              <View style={styles.block}>
                <Text style={styles.meta}>Pasien</Text>
                {slot.patients.map((name, index) => (
                  <Text key={`${key}-${index}`} style={styles.value}>
                    {index + 1}. {name}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E3E7EE',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    borderColor: '#1F4E5F',
    backgroundColor: '#E7F0F3',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeBlock: {
    flex: 1,
    gap: 2,
  },
  block: {
    gap: 2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C6778',
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2430',
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1C2430',
  },
  pick: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F4E5F',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickSelected: {
    backgroundColor: '#1F4E5F',
  },
  pickText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F4E5F',
  },
  pickTextSelected: {
    color: '#FFFFFF',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3F4A5A',
  },
  messageBlock: {
    gap: 8,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9B2335',
  },
  reload: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F4E5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F4E5F',
  },
});
