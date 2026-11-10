const MAX_IMAGE_LENGTH = 8_000_000;
const BLOB_API = 'https://vercel.com/api/blob';
const BLOB_API_VERSION = '13';

type BlobAuth = {
  token: string;
  storeId: string;
};

function storeIdFromToken(token: string) {
  const [, , , storeId = ''] = token.split('_');
  return storeId;
}

function blobAuth(): BlobAuth {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim().replace(/^store_/, '');
  if (!token || !storeId) {
    throw new Error('Blob storage is not configured');
  }
  if (storeIdFromToken(token) !== storeId) {
    throw new Error('Blob store id does not match the read-write token');
  }
  return { token, storeId };
}

async function blobRequest(auth: BlobAuth, path: string, init: RequestInit) {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${auth.token}`);
  headers.set('x-vercel-blob-store-id', auth.storeId);
  headers.set('x-api-version', BLOB_API_VERSION);
  const response = await fetch(`${BLOB_API}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Blob request failed (${response.status})`);
  }
  return response;
}

export function ktpStamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function ktpImageBytes(value: unknown) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const base64 = value.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').replace(/\s/g, '');
  if (!base64 || base64.length > MAX_IMAGE_LENGTH || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return undefined;
  }
  const bytes = Buffer.from(base64, 'base64');
  return bytes.length > 0 ? bytes : undefined;
}

async function putKtp(phone: string, fileName: string, bytes: Buffer, auth: BlobAuth) {
  const pathname = `${phone}/${fileName}`;
  const params = new URLSearchParams({ pathname });
  const response = await blobRequest(auth, `/?${params}`, {
    method: 'PUT',
    body: new Uint8Array(bytes),
    headers: {
      'x-vercel-blob-access': 'private',
      'x-content-type': 'image/jpeg',
      'x-add-random-suffix': '0',
    },
  });
  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    throw new Error('Blob upload did not return a url');
  }
  return data.url;
}

export async function uploadBookingKtp(phone: string, pasien: Buffer | null, pengantre: Buffer | null) {
  if (!pasien && !pengantre) {
    return [];
  }
  const auth = blobAuth();
  const stamp = ktpStamp();
  const uploaded: string[] = [];
  try {
    if (pasien) {
      uploaded.push(await putKtp(phone, `${stamp}.jpg`, pasien, auth));
    }
    if (pengantre) {
      uploaded.push(await putKtp(phone, `${stamp}-pengantre.jpg`, pengantre, auth));
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length > 0) {
      await removeBookingKtp(uploaded).catch((cleanupError) => {
        console.error(cleanupError);
      });
    }
    throw error;
  }
}

export async function removeBookingKtp(urls: string[]) {
  if (urls.length === 0) {
    return;
  }
  const auth = blobAuth();
  await blobRequest(auth, '/delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ urls }),
  });
}
