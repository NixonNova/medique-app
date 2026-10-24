import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { pilihGambar } from '@/lib/pilih-gambar';

export type PatientFormValue = {
  namaPasien: string;
  nikPasien: string;
  noTelp: string;
  email: string;
  ktpPasien: string | null;
  bukanPasien: boolean;
  namaPengantre: string;
  nikPengantre: string;
  ktpPengantre: string | null;
};

export const emptyPatientForm: PatientFormValue = {
  namaPasien: '',
  nikPasien: '',
  noTelp: '',
  email: '',
  ktpPasien: null,
  bukanPasien: false,
  namaPengantre: '',
  nikPengantre: '',
  ktpPengantre: null,
};

export function patientFormMessage(value: PatientFormValue) {
  if (!value.namaPasien.trim()) {
    return 'Isi nama lengkap pasien.';
  }
  if (value.nikPasien.length !== 16) {
    return 'NIK pasien harus 16 digit.';
  }
  if (value.noTelp.length < 10 || value.noTelp.length > 15) {
    return 'No. Telp. harus 10–15 digit.';
  }
  if (!isEmail(value.email.trim())) {
    return 'Isi email yang valid.';
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

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function PatientDataForm({
  value,
  onChange,
  emailReadOnly = false,
  onGetOtp,
}: {
  value: PatientFormValue;
  onChange: (patch: Partial<PatientFormValue>) => void;
  emailReadOnly?: boolean;
  onGetOtp?: () => void;
}) {
  const canGetOtp = isEmail(value.email.trim());
  const showGetOtp = Boolean(onGetOtp) && !emailReadOnly;
  const showDetails = !showGetOtp;

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!emailReadOnly}
          keyboardType="email-address"
          onChangeText={(email) => onChange({ email })}
          placeholder="siti@email.com"
          placeholderTextColor="#8B95A5"
          style={[styles.input, emailReadOnly ? styles.inputReadOnly : null]}
          value={value.email}
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
          <Field
            keyboardType="phone-pad"
            label="No. Telp."
            onChangeText={(noTelp) => onChange({ noTelp: digits(noTelp, 15) })}
            placeholder="081234567890"
            value={value.noTelp}
          />
          <UploadField
            fileName={value.ktpPasien}
            label="KTP Pasien"
            onPress={async () => {
              const nama = await pilihGambar();
              if (nama) {
                onChange({ ktpPasien: nama });
              }
            }}
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
              <UploadField
                fileName={value.ktpPengantre}
                label="KTP pengantre"
                onPress={async () => {
                  const nama = await pilihGambar();
                  if (nama) {
                    onChange({ ktpPengantre: nama });
                  }
                }}
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
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
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
}: {
  label: string;
  fileName: string | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityLabel={`Unggah ${label}`} accessibilityRole="button" onPress={onPress} style={styles.upload}>
        <Text style={styles.uploadText}>Unggah</Text>
      </Pressable>
      {fileName ? <Text style={styles.file}>{fileName}</Text> : null}
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
});
