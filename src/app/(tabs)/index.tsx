import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ANTRIAN_SAAT_INI, useAppState } from '@/state/app-state';

export default function AntriScreen() {
  const router = useRouter();
  const { loggedIn, openLogin } = useAppState();

  function ambilAntrian() {
    if (loggedIn) {
      router.push('/ambil');
      return;
    }
    openLogin('ambil');
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.label}>Antrian saat ini:</Text>
        <Text style={styles.value}>{ANTRIAN_SAAT_INI}</Text>
        <Pressable accessibilityRole="button" onPress={ambilAntrian} style={styles.button}>
          <Text style={styles.buttonText}>Ambil antrian</Text>
        </Pressable>
        <Text style={styles.note}>
          Antrian akan otomatis di atur sistem berdasarkan waktu slot kosong yang paling awal.
          Pasien tidak bisa memilih waktu
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#1C2430',
  },
  value: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2430',
  },
  button: {
    minHeight: 48,
    marginTop: 16,
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
  note: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#3F4A5A',
  },
});
