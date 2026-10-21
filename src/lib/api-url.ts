import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function apiUrl(path: string) {
  if (Platform.OS === 'web') {
    return path;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return path;
  }

  const base = /^https?:\/\//.test(hostUri) ? hostUri : `http://${hostUri}`;
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}
