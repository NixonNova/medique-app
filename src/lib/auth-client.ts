import { expoClient } from '@better-auth/expo/client';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { nativeServerOrigin } from '@/lib/api-url';

function authBaseURL() {
  return nativeServerOrigin();
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
    phoneNumberClient(),
  ],
});
