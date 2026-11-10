import Constants from 'expo-constants';
import { Platform } from 'react-native';

const HOSTED_ORIGIN = 'https://medique-app.expo.app';

function hostedOrigin() {
  const configured = Constants.expoConfig?.extra?.router?.origin;
  if (typeof configured === 'string' && configured.trim()) {
    return configured.replace(/\/$/, '');
  }
  return HOSTED_ORIGIN;
}

/** Dev server while Expo is running; the hosted API in a standalone build. */
export function nativeServerOrigin() {
  if (Platform.OS === 'web') {
    return undefined;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const base = /^https?:\/\//.test(hostUri) ? hostUri : `http://${hostUri}`;
    return base.replace(/\/$/, '');
  }

  return hostedOrigin();
}

export function apiUrl(path: string) {
  const origin = nativeServerOrigin();
  if (!origin) {
    return path;
  }

  return new URL(path, `${origin}/`).toString();
}
