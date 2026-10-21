import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function authBaseURL() {
  if (Platform.OS === 'web') {
    return undefined;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return undefined;
  }
  const base = /^https?:\/\//.test(hostUri) ? hostUri : `http://${hostUri}`;
  return base.replace(/\/$/, '');
}

export const authClient = createAuthClient({
  baseURL: authBaseURL(),
  ...(Platform.OS === 'web' ? { fetchOptions: { credentials: 'include' as const } } : {}),
  plugins: [
    ...(Platform.OS === 'web'
      ? []
      : [
          expoClient({
            scheme: 'mediqueapp',
            storagePrefix: 'medique',
            storage: SecureStore,
          }),
        ]),
    emailOTPClient(),
  ],
});
