import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { pilihGambar } from '@/lib/pilih-gambar';
import { useAppState } from '@/state/app-state';

export default function HistoryScreen() {
  const { antrian, unggahBukti } = useAppState();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.date]}>Tanggal</Text>
          <Text style={[styles.headerCell, styles.session]}>Sesi</Text>
          <View style={styles.action} />
        </View>
        {antrian.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={[styles.cell, styles.date]}>{item.tanggal}</Text>
            <Text style={[styles.cell, styles.session]}>{item.sesi}</Text>
            <View style={styles.action}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Unggah bukti ${item.tanggal}`}
                onPress={async () => {
                  const nama = await pilihGambar();
                  if (nama) {
                    unggahBukti(item.id, nama);
                  }
                }}
                style={styles.upload}>
                <Text style={styles.uploadText}>{item.bukti ? 'Ganti' : 'Unggah'}</Text>
              </Pressable>
              {item.bukti ? <Text style={styles.file}>{item.bukti}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E7EE',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    flex: 1.2,
  },
  session: {
    flex: 1,
  },
  action: {
    width: 88,
  },
  upload: {
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
    paddingHorizontal: 8,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  file: {
    marginTop: 4,
    fontSize: 11,
    color: '#3F4A5A',
  },
});
