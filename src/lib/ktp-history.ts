import { Platform } from 'react-native';

import { apiUrl } from '@/lib/api-url';
import { authClient } from '@/lib/auth-client';

export type KtpHistori = {
  fileName: string;
  base64: string;
};

type ErrorBody = {
  error?: string;
};

async function sessionHeaders() {
  const headers = new Headers();
  if (Platform.OS === 'web' || !('getCookie' in authClient) || typeof authClient.getCookie !== 'function') {
    return headers;
  }
  const cookie = await authClient.getCookie();
  if (cookie) {
    headers.set('cookie', cookie);
  }
  return headers;
}

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

async function ktpHistoryRequest(phone: string, download: boolean) {
  const params = new URLSearchParams({ phone });
  if (download) {
    params.set('download', '1');
  }
  return fetch(apiUrl(`/api/ktp-history?${params}`), {
    cache: 'no-store',
    credentials: 'include',
    headers: await sessionHeaders(),
  });
}

export async function fetchKtpHistoryAvailable(phone: string) {
  const response = await ktpHistoryRequest(phone, false);
  if (!response.ok) {
    return false;
  }
  const body = (await response.json()) as { available?: unknown };
  return body.available === true;
}

export async function fetchLatestKtp(phone: string): Promise<KtpHistori> {
  const response = await ktpHistoryRequest(phone, true);
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'KTP histori tidak dapat diambil.'));
  }
  const body = (await response.json()) as { fileName?: unknown; base64?: unknown };
  if (typeof body.fileName !== 'string' || typeof body.base64 !== 'string' || !body.base64) {
    throw new Error('KTP histori tidak dapat diambil.');
  }
  return { fileName: body.fileName, base64: body.base64 };
}
