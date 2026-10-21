import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WorkingDaySlotSummary } from '@/lib/booking';
import { formatBulan, monthCells, todayIso } from '@/lib/tanggal';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const;

type SlotCalendarProps = {
  visibleMonth: Date;
  selectedDate: string | null;
  summaries: WorkingDaySlotSummary[];
  loading: boolean;
  error: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  onReload: () => void;
};

export function SlotCalendar({
  visibleMonth,
  selectedDate,
  summaries,
  loading,
  error,
  onSelectDate,
  onChangeMonth,
  onReload,
}: SlotCalendarProps) {
  const today = todayIso();
  const now = new Date();
  const canGoPrevious =
    visibleMonth.getFullYear() > now.getFullYear() ||
    (visibleMonth.getFullYear() === now.getFullYear() && visibleMonth.getMonth() > now.getMonth());
  const byDate = new Map(summaries.map((summary) => [summary.date, summary]));
  const cells = monthCells(visibleMonth);
  const weeks: (typeof cells)[] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return (
    <View style={[styles.card, loading ? styles.loading : null]}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityLabel="Bulan sebelumnya"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoPrevious }}
          disabled={!canGoPrevious}
          onPress={() => {
            if (canGoPrevious) {
              onChangeMonth(-1);
            }
          }}
          style={[styles.arrow, canGoPrevious ? null : styles.arrowDisabled]}>
          <Text style={[styles.arrowText, canGoPrevious ? null : styles.arrowTextDisabled]}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{formatBulan(visibleMonth)}</Text>
        <Pressable
          accessibilityLabel="Bulan berikutnya"
          accessibilityRole="button"
          onPress={() => onChangeMonth(1)}
          style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Muat ulang kalender"
          accessibilityRole="button"
          accessibilityState={{ busy: loading }}
          onPress={onReload}
          style={styles.reload}>
          <Text style={styles.reloadText}>{loading ? 'Memuat...' : 'Muat ulang'}</Text>
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((cell, cellIndex) => {
            if (!cell) {
              return <View key={`empty-${weekIndex}-${cellIndex}`} style={styles.cell} />;
            }

            const summary = byDate.get(cell.iso);
            const past = cell.iso < today;
            const selected = !past && cell.iso === selectedDate;
            const isToday = cell.iso === today;
            const ratio = !past && summary ? `${summary.verifiedBookingCount} / ${summary.totalSlotCount}` : '';
            const summaryLabel = !past && summary
              ? `${cell.day}, ${summary.verifiedBookingCount} dari ${summary.totalSlotCount} slot terisi`
              : String(cell.day);

            return (
              <Pressable
                key={cell.iso}
                accessibilityLabel={past ? `${cell.day}, tanggal sudah lewat` : summaryLabel}
                accessibilityRole="button"
                accessibilityState={{ disabled: past, selected }}
                disabled={past}
                onPress={() => {
                  if (!past) {
                    onSelectDate(cell.iso);
                  }
                }}
                style={[
                  styles.cell,
                  styles.day,
                  past ? styles.dayPast : null,
                  selected ? styles.daySelected : null,
                  !past && !selected && isToday ? styles.dayToday : null,
                ]}>
                <Text style={[styles.dayNumber, past ? styles.dayTextPast : null, selected ? styles.dayTextSelected : null]}>
                  {cell.day}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.ratio,
                    selected ? styles.dayTextSelected : null,
                    !past && !selected && summary && summary.verifiedBookingCount < summary.totalSlotCount
                      ? styles.ratioOpen
                      : null,
                  ]}>
                  {ratio || ' '}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      <Text style={styles.caption}>Setiap tanggal menampilkan antrian terverifikasi / total slot.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E3E7EE',
    borderRadius: 12,
    padding: 8,
  },
  loading: {
    opacity: 0.72,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  arrowText: {
    fontSize: 24,
    lineHeight: 28,
    color: '#1F4E5F',
  },
  arrowTextDisabled: {
    color: '#8B95A5',
  },
  month: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2430',
    textAlign: 'center',
  },
  reload: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F4E5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F4E5F',
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#5C6778',
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    minHeight: 56,
    margin: 2,
  },
  day: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F8',
  },
  dayPast: {
    backgroundColor: 'transparent',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: '#1F4E5F',
  },
  daySelected: {
    backgroundColor: '#1F4E5F',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C2430',
  },
  ratio: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#5C6778',
  },
  ratioOpen: {
    color: '#1F4E5F',
    fontWeight: '600',
  },
  dayTextPast: {
    color: '#C5CCD6',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  caption: {
    marginTop: 8,
    marginHorizontal: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#5C6778',
  },
  error: {
    marginTop: 6,
    marginHorizontal: 4,
    fontSize: 13,
    color: '#9B2335',
  },
});
