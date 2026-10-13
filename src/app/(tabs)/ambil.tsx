import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { pilihGambar } from '@/lib/pilih-gambar';
import { useAppState } from '@/state/app-state';

export default function AmbilScreen() {
  const router = useRouter();
  const { tambahAntrian } = useAppState();
  const [namaPasien, setNamaPasien] = useState('');
  const [nikPasien, setNikPasien] = useState('');
  const [ktpPasien, setKtpPasien] = useState<string | null>(null);
  const [bukanPasien, setBukanPasien] = useState(false);
  const [namaPengantre, setNamaPengantre] = useState('');
  const [nikPengantre, setNikPengantre] = useState('');
  const [ktpPengantre, setKtpPengantre] = useState<string | null>(null);

  function submit() {
    tambahAntrian();
    router.replace('/konfirmasi');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Nama lengkap Pasien" value={namaPasien} onChangeText={setNamaPasien} placeholder="Siti Rahmawati" />
        <Field
          label="NIK Pasien"
          value={nikPasien}
          onChangeText={(value) => setNikPasien(value.replace(/\D/g, '').slice(0, 16))}
          placeholder="3174012501900001"
          keyboardType="number-pad"
        />
        <UploadField
          label="KTP Pasien"
          fileName={ktpPasien}
          onPress={async () => {
            const nama = await pilihGambar();
            if (nama) {
              setKtpPasien(nama);
            }
          }}
        />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: bukanPasien }}
          onPress={() => setBukanPasien((current) => !current)}
          style={styles.check}>
          <View style={[styles.box, bukanPasien ? styles.boxOn : null]} />
          <Text style={styles.checkLabel}>Pengantre bukan pasien</Text>
        </Pressable>
        {bukanPasien ? (
          <>
            <Field
              label="Nama lengkap pengantre"
              value={namaPengantre}
              onChangeText={setNamaPengantre}
              placeholder="Budi Santoso"
            />
            <Field
              label="NIK pengantre"
              value={nikPengantre}
              onChangeText={(value) => setNikPengantre(value.replace(/\D/g, '').slice(0, 16))}
              placeholder="3174011201850002"
              keyboardType="number-pad"
            />
            <UploadField
              label="KTP pengantre"
              fileName={ktpPengantre}
              onPress={async () => {
                const nama = await pilihGambar();
                if (nama) {
                  setKtpPengantre(nama);
                }
              }}
            />
          </>
        ) : null}
        <Pressable accessibilityRole="button" onPress={submit} style={styles.submit}>
          <Text style={styles.submitText}>Submit Antrian</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B95A5"
        keyboardType={keyboardType ?? 'default'}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

function UploadField({
  label,
  fileName,
  onPress,
}: {
  label: string;
  fileName: string | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Unggah ${label}`} onPress={onPress} style={styles.upload}>
        <Text style={styles.uploadText}>Unggah</Text>
      </Pressable>
      {fileName ? <Text style={styles.file}>{fileName}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#1C2430',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D5DBE3',
    borderRadius: 8,
    fontSize: 16,
    color: '#1C2430',
  },
  upload: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  file: {
    fontSize: 13,
    color: '#3F4A5A',
  },
  check: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#1F4E5F',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  boxOn: {
    backgroundColor: '#1F4E5F',
  },
  checkLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1C2430',
  },
  submit: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
