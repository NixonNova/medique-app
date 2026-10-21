import { apiUrl } from '@/lib/api-url';

const PATH = '/api/antrian-saat-ini';

export async function fetchAntrianSaatIni(): Promise<string | null> {
  const response = await fetch(apiUrl(PATH));
  if (!response.ok) {
    throw new Error('Gagal memuat antrian');
  }
  const data = (await response.json()) as { label?: string | null };
  return data.label ?? null;
}
