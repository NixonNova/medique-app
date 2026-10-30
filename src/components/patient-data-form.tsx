import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { isPhone, phoneText } from '@/lib/phone';
import { pilihGambar } from '@/lib/pilih-gambar';
import { scanKtp } from '@/lib/scan-ktp';

export type PatientFormValue = {
  namaPasien: string;
  nikPasien: string;
  noTelp: string;
  ktpPasien: string | null;
  ktpPasienBase64: string | null;
  bukanPasien: boolean;
  namaPengantre: string;
  nikPengantre: string;
  ktpPengantre: string | null;
  ktpPengantreBase64: string | null;
};

export const emptyPatientForm: PatientFormValue = {
  namaPasien: '',
  nikPasien: '',
  noTelp: '',
  ktpPasien: null,
  ktpPasienBase64: null,
  bukanPasien: false,
  namaPengantre: '',
  nikPengantre: '',
  ktpPengantre: null,
  ktpPengantreBase64: null,
};

export function patientFormMessage(value: PatientFormValue) {
  if (!value.namaPasien.trim()) {
    return 'Isi nama lengkap pasien.';
  }
  if (value.nikPasien.length !== 16) {
    return 'NIK pasien harus 16 digit.';
  }
  if (!isPhone(value.noTelp)) {
    return 'No. Telp. harus nomor Indonesia, contoh 081234567890.';
  }
  if (value.bukanPasien) {
    if (!value.namaPengantre.trim()) {
      return 'Isi nama lengkap pengantre.';
    }
    if (value.nikPengantre.length !== 16) {
      return 'NIK pengantre harus 16 digit.';
    }
  }
  return null;
}

function digits(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function PatientDataForm({
  value,
  onChange,
  phoneReadOnly = false,
  onGetOtp,
}: {
  value: PatientFormValue;
  onChange: (patch: Partial<PatientFormValue>) => void;
  phoneReadOnly?: boolean;
  onGetOtp?: () => void;
}) {
  const canGetOtp = isPhone(value.noTelp);
  const showGetOtp = Boolean(onGetOtp) && !phoneReadOnly;
  const showDetails = !showGetOtp;
  const scanId = useRef(0);
  const pengantreScanId = useRef(0);
  const [scanningKtp, setScanningKtp] = useState(false);
  const [ktpStatus, setKtpStatus] = useState<string | null>(null);
  const [ktpVerified, setKtpVerified] = useState(false);
  const [scanningKtpPengantre, setScanningKtpPengantre] = useState(false);
  const [ktpPengantreStatus, setKtpPengantreStatus] = useState<string | null>(null);
  const [ktpPengantreVerified, setKtpPengantreVerified] = useState(false);

  async function unggahKtpPasien() {
    const gambar = await pilihGambar({ base64: true });
    if (!gambar) {
      return;
    }

    const id = ++scanId.current;
    onChange({ ktpPasien: gambar.fileName, ktpPasienBase64: gambar.base64 });
    setKtpVerified(false);
    if (!gambar.base64) {
      setKtpStatus('Foto KTP tidak dapat dibaca.');
      return;
    }

    setScanningKtp(true);
    setKtpStatus('Membaca KTP…');
    try {
      const hasil = await scanKtp(gambar.base64);
      if (scanId.current !== id) {
        return;
      }
      onChange({
        ktpPasien: gambar.fileName,
        ...(hasil.fullName ? { namaPasien: hasil.fullName } : {}),
        ...(hasil.documentNumber ? { nikPasien: digits(hasil.documentNumber, 16) } : {}),
      });
      const extracted = Boolean(hasil.fullName && hasil.documentNumber);
      setKtpVerified(extracted);
      if (!hasil.fullName && !hasil.documentNumber) {
        setKtpStatus('Nama dan NIK tidak terbaca dari KTP.');
      } else if (!hasil.fullName) {
        setKtpStatus('Nama tidak terbaca dari KTP.');
      } else if (!hasil.documentNumber) {
        setKtpStatus('NIK tidak terbaca dari KTP.');
      } else {
        setKtpStatus(null);
      }
    } catch (error) {
      if (scanId.current !== id) {
        return;
      }
      setKtpVerified(false);
      setKtpStatus(error instanceof Error ? error.message : 'KTP tidak dapat dibaca.');
    } finally {
      if (scanId.current === id) {
        setScanningKtp(false);
      }
    }
  }

  async function unggahKtpPengantre() {
    const gambar = await pilihGambar({ base64: true });
    if (!gambar) {
      return;
    }

    const id = ++pengantreScanId.current;
    onChange({ ktpPengantre: gambar.fileName, ktpPengantreBase64: gambar.base64 });
    setKtpPengantreVerified(false);
    if (!gambar.base64) {
      setKtpPengantreStatus('Foto KTP tidak dapat dibaca.');
      return;
    }

    setScanningKtpPengantre(true);
    setKtpPengantreStatus('Membaca KTP…');
    try {
      const hasil = await scanKtp(gambar.base64);
      if (pengantreScanId.current !== id) {
        return;
      }
      onChange({
        ktpPengantre: gambar.fileName,
        ...(hasil.fullName ? { namaPengantre: hasil.fullName } : {}),
        ...(hasil.documentNumber ? { nikPengantre: digits(hasil.documentNumber, 16) } : {}),
      });
      const extracted = Boolean(hasil.fullName && hasil.documentNumber);
      setKtpPengantreVerified(extracted);
      if (!hasil.fullName && !hasil.documentNumber) {
        setKtpPengantreStatus('Nama dan NIK tidak terbaca dari KTP.');
      } else if (!hasil.fullName) {
        setKtpPengantreStatus('Nama tidak terbaca dari KTP.');
      } else if (!hasil.documentNumber) {
        setKtpPengantreStatus('NIK tidak terbaca dari KTP.');
      } else {
        setKtpPengantreStatus(null);
      }
    } catch (error) {
      if (pengantreScanId.current !== id) {
        return;
      }
      setKtpPengantreVerified(false);
      setKtpPengantreStatus(error instanceof Error ? error.message : 'KTP tidak dapat dibaca.');
    } finally {
      if (pengantreScanId.current === id) {
        setScanningKtpPengantre(false);
      }
    }
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>No. Telp.</Text>
        <TextInput
          accessibilityLabel="No. Telp."
          editable={!phoneReadOnly}
          keyboardType="phone-pad"
          onChangeText={(noTelp) => onChange({ noTelp: phoneText(noTelp) })}
          placeholder="081234567890"
          placeholderTextColor="#8B95A5"
          style={[styles.input, phoneReadOnly ? styles.inputReadOnly : null]}
          value={value.noTelp}
        />
        {showGetOtp ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canGetOtp }}
            disabled={!canGetOtp}
            onPress={onGetOtp}
            style={[styles.getOtp, canGetOtp ? null : styles.getOtpDisabled]}>
            <Text style={[styles.getOtpText, canGetOtp ? null : styles.getOtpTextDisabled]}>Get OTP</Text>
          </Pressable>
        ) : null}
      </View>
      {showDetails ? (
        <>
          <UploadField
            busy={scanningKtp}
            fileName={value.ktpPasien}
            label="KTP Pasien"
            onPress={unggahKtpPasien}
            status={ktpStatus}
            verified={ktpVerified}
          />

          <Field
            label="Nama lengkap Pasien"
            onChangeText={(namaPasien) => onChange({ namaPasien })}
            placeholder="Siti Rahmawati"
            value={value.namaPasien}
          />
          <Field
            keyboardType="number-pad"
            label="NIK Pasien"
            onChangeText={(nikPasien) => onChange({ nikPasien: digits(nikPasien, 16) })}
            placeholder="3174012501900001"
            value={value.nikPasien}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: value.bukanPasien }}
            onPress={() => onChange({ bukanPasien: !value.bukanPasien })}
            style={styles.check}>
            <View style={[styles.box, value.bukanPasien ? styles.boxOn : null]} />
            <Text style={styles.checkLabel}>Pengantre bukan pasien</Text>
          </Pressable>

          {value.bukanPasien ? (
            <>
              <UploadField
                busy={scanningKtpPengantre}
                fileName={value.ktpPengantre}
                label="KTP pengantre"
                onPress={unggahKtpPengantre}
                status={ktpPengantreStatus}
                verified={ktpPengantreVerified}
              />

              <Field
                label="Nama lengkap pengantre"
                onChangeText={(namaPengantre) => onChange({ namaPengantre })}
                placeholder="Budi Santoso"
                value={value.namaPengantre}
              />
              <Field
                keyboardType="number-pad"
                label="NIK pengantre"
                onChangeText={(nikPengantre) => onChange({ nikPengantre: digits(nikPengantre, 16) })}
                placeholder="3174011201850002"
                value={value.nikPengantre}
              />
            </>
          ) : null}

        </>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCapitalize === 'none' ? false : undefined}
        keyboardType={keyboardType ?? 'default'}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B95A5"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function UploadField({
  label,
  fileName,
  onPress,
  busy = false,
  status,
  verified = false,
}: {
  label: string;
  fileName: string | null;
  onPress: () => void;
  busy?: boolean;
  status?: string | null;
  verified?: boolean;
}) {
  const reading = status === 'Membaca KTP…';
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {verified ? (
          <SymbolView
            accessibilityLabel="Data KTP terbaca"
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
            size={18}
            tintColor="#1E8E3E"
          />
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={`Unggah ${label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={onPress}
        style={[styles.upload, busy ? styles.uploadBusy : null]}>
        <Text style={styles.uploadText}>{busy ? 'Membaca…' : 'Unggah'}</Text>
      </Pressable>
      {fileName ? <Text style={styles.file}>{fileName}</Text> : null}
      {status ? <Text style={reading ? styles.file : styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  inputReadOnly: {
    backgroundColor: '#F3F5F8',
    color: '#3F4A5A',
  },
  getOtp: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  getOtpDisabled: {
    backgroundColor: '#E3E7EE',
  },
  getOtpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  getOtpTextDisabled: {
    color: '#8B95A5',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  uploadBusy: {
    backgroundColor: '#8BA4AE',
  },
  file: {
    fontSize: 13,
    color: '#3F4A5A',
  },
  status: {
    fontSize: 13,
    color: '#8A3B2C',
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
});
