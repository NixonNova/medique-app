import { apiUrl } from '@/lib/api-url';

export type KtpReading = {
  fullName: string | null;
  documentNumber: string | null;
};

type ErrorBody = {
  error?: string;
};

export async function scanKtp(image: string): Promise<KtpReading> {
  const response = await fetch(apiUrl('/api/ktp-scan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('KTP tidak dapat dibaca.');
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' ? (body as ErrorBody).error : null;
    throw new Error(message || 'KTP tidak dapat dibaca.');
  }

  const reading = body as { fullName?: unknown; documentNumber?: unknown };
  return {
    fullName: typeof reading.fullName === 'string' ? reading.fullName : null,
    documentNumber: typeof reading.documentNumber === 'string' ? reading.documentNumber : null,
  };
}
