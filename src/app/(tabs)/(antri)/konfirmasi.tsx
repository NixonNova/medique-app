import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';

const PESAN = [
  'Antrean anda telah berhasil tercatat oleh sistem.',
  'Anda boleh menutup halaman ini dan melihat update status antrian melalui Histori Antrian',
];

export default function KonfirmasiScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {PESAN.map((pesan) => (
            <View key={pesan} style={styles.item}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.pesan}>{pesan}</Text>
            </View>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>Tutup</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  list: {
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#1C2430',
  },
  pesan: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1C2430',
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
