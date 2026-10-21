import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { useAppState } from '@/state/app-state';

export function LoginModal() {
  const { loginOpen } = useAppState();

  if (!loginOpen) {
    return null;
  }

  return <LoginForm />;
}

function LoginForm() {
  const { closeLogin } = useAppState();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const address = email.trim().toLowerCase();
    if (!isEmail(address)) {
      setError('Isi email yang valid.');
      return;
    }
    setPending('send');
    setError(null);
    const result = await authClient.emailOtp.sendVerificationOtp({
      email: address,
      type: 'sign-in',
    });
    setPending(null);
    if (result.error) {
      setError(authError(result.error));
      return;
    }
    setSent(true);
  }

  async function submit() {
    const address = email.trim().toLowerCase();
    if (!sent) {
      setError('Kirim OTP terlebih dahulu.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Masukkan OTP 6 digit.');
      return;
    }
    setPending('verify');
    setError(null);
    const result = await authClient.signIn.emailOtp({
      email: address,
      otp,
    });
    setPending(null);
    if (result.error) {
      setError(authError(result.error));
      return;
    }
    closeLogin();
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Masuk dengan OTP</Text>
        <Text style={styles.copy}>
          {sent ? `Kode OTP telah dikirim ke ${email.trim().toLowerCase()}.` : 'Masukkan email. Kode OTP akan dikirim ke email tersebut.'}
        </Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={pending === null}
          keyboardType="email-address"
          onChangeText={(value) => {
            setEmail(value);
            setSent(false);
            setOtp('');
            setError(null);
          }}
          placeholder="siti@email.com"
          placeholderTextColor="#8B95A5"
          style={styles.input}
          value={email}
        />
        <Pressable
          accessibilityRole="button"
          disabled={pending !== null}
          onPress={() => void sendCode()}
          style={[styles.secondaryButton, pending !== null ? styles.disabled : null]}>
          {pending === 'send' ? (
            <ActivityIndicator color="#1F4E5F" />
          ) : (
            <Text style={styles.secondaryButtonText}>{sent ? 'Kirim ulang OTP' : 'Kirim OTP'}</Text>
          )}
        </Pressable>
        <Text style={styles.label}>OTP</Text>
        <TextInput
          accessibilityLabel="OTP"
          editable={pending === null}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) => {
            setOtp(value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
          placeholder="123456"
          placeholderTextColor="#8B95A5"
          style={styles.otp}
          value={otp}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={pending !== null}
          onPress={() => void submit()}
          style={[styles.primary, pending !== null ? styles.disabled : null]}>
          {pending === 'verify' ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Masuk</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={pending !== null}
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

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function authError(error: { code?: string; message?: string }) {
  if (error.code === 'TOO_MANY_ATTEMPTS' || error.code === 'TOO_MANY_REQUESTS') {
    return 'Terlalu banyak percobaan. Minta kode baru.';
  }
  if (error.code === 'INVALID_OTP' || error.code === 'OTP_EXPIRED') {
    return 'Kode OTP tidak sesuai.';
  }
  return error.message || 'Tidak dapat masuk.';
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
    fontSize: 16,
    color: '#1C2430',
  },
  otp: {
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
  secondaryButton: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F4E5F',
  },
  secondaryButtonText: {
    color: '#1F4E5F',
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
  disabled: {
    opacity: 0.6,
  },
});
