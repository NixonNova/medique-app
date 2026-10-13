import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppState } from '@/state/app-state';

export function LoginModal() {
  const { loginOpen } = useAppState();

  if (!loginOpen) {
    return null;
  }

  return <LoginForm />;
}

function LoginForm() {
  const router = useRouter();
  const { closeLogin, loginWithOtp } = useAppState();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const result = loginWithOtp(otp);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.next === 'ambil') {
      router.push('/ambil');
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Masuk dengan OTP</Text>
        <Text style={styles.copy}>Kode OTP 5 digit telah dikirim melalui SMS.</Text>
        <Text style={styles.label}>OTP</Text>
        <TextInput
          value={otp}
          onChangeText={(value) => {
            setOtp(value.replace(/\D/g, '').slice(0, 5));
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={5}
          placeholder="81234"
          placeholderTextColor="#8B95A5"
          style={styles.input}
          accessibilityLabel="OTP"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={submit} style={styles.primary}>
          <Text style={styles.primaryText}>Masuk</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setError(null);
            closeLogin();
          }}
          style={styles.secondary}>
          <Text style={styles.secondaryText}>Batal</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 5,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(18, 24, 33, 0.45)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2430',
  },
  copy: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#3F4A5A',
  },
  label: {
    marginTop: 16,
    fontSize: 15,
    color: '#1C2430',
  },
  input: {
    minHeight: 48,
    marginTop: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D5DBE3',
    borderRadius: 8,
    fontSize: 18,
    letterSpacing: 4,
    color: '#1C2430',
  },
  error: {
    marginTop: 8,
    color: '#9B1C1C',
    fontSize: 14,
  },
  primary: {
    minHeight: 48,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondary: {
    minHeight: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#1F4E5F',
    fontSize: 16,
  },
});
