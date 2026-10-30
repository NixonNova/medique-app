const DOC_CHEAP_URL = 'https://api.doc.cheap/v1/scans';
const MAX_IMAGE_LENGTH = 8_000_000;

export type KtpReading = {
  fullName: string | null;
  documentNumber: string | null;
};

export class ScanKtpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ScanKtpError';
    this.status = status;
  }
}

type ScanField = {
  name?: unknown;
  value?: unknown;
  language?: unknown;
};

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function digits(value: string) {
  const nik = value.replace(/\D/g, '').slice(0, 16);
  return nik || null;
}

function fieldValue(fields: ScanField[], name: string) {
  const matches = fields.filter((field) => field.name === name && text(field.value));
  const latin = matches.find((field) => field.language === 'English' || field.language == null);
  return text((latin ?? matches[0])?.value);
}

function scanFailureMessage(status: string | null) {
  switch (status) {
    case 'no_document_found':
      return 'KTP tidak ditemukan pada foto. Unggah foto yang lebih jelas.';
    case 'unreadable':
      return 'Tulisan pada KTP tidak terbaca. Coba foto yang lebih terang.';
    case 'unsupported_document':
      return 'Dokumen ini tidak dikenali sebagai KTP.';
    case 'rejected':
      return 'Foto KTP ditolak. Coba unggah ulang.';
    default:
      return 'KTP tidak dapat dibaca.';
  }
}

function httpFailureMessage(code: string | null) {
  switch (code) {
    case 'insufficient_credits':
      return 'Kuota pembacaan KTP habis.';
    case 'rate_limited':
      return 'Terlalu banyak percobaan. Coba lagi sebentar.';
    case 'payload_too_large':
      return 'Foto KTP terlalu besar.';
    case 'unsupported_media_type':
      return 'Foto harus berupa JPEG atau PNG.';
    default:
      return 'KTP tidak dapat dibaca.';
  }
}

function readErrorCode(body: unknown) {
  if (!body || typeof body !== 'object' || !('error' in body)) {
    return null;
  }
  const error = body.error;
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null;
  }
  return text(error.code);
}

export async function scanKtpImage(image: string): Promise<KtpReading> {
  const apiKey = process.env.DOC_CHEAP_API_KEY?.trim();
  if (!apiKey) {
    throw new ScanKtpError('Pembacaan KTP belum dikonfigurasi.', 500);
  }

  const normalized = image.replace(/\s/g, '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  if (!normalized) {
    throw new ScanKtpError('Foto KTP kosong.', 400);
  }
  if (normalized.length > MAX_IMAGE_LENGTH) {
    throw new ScanKtpError('Foto KTP terlalu besar.', 413);
  }
  if (!normalized.startsWith('/9j/') && !normalized.startsWith('iVBORw0KGgo')) {
    throw new ScanKtpError('Foto harus berupa JPEG atau PNG.', 415);
  }

  const response = await fetch(DOC_CHEAP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: normalized,
      reference: 'ktp-pasien',
      options: {
        expect_country: 'IDN',
        return_portrait: false,
        retain_hours: 0,
      },
    }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ScanKtpError('KTP tidak dapat dibaca.', 502);
  }

  if (!response.ok) {
    const code = readErrorCode(body);
    console.error(`[medique] doc.cheap scan failed (${response.status}): ${code ?? 'unknown'}`);
    throw new ScanKtpError(httpFailureMessage(code), response.status >= 500 ? 502 : response.status);
  }

  const scan = body as {
    meta?: { status?: unknown };
    document?: { number?: unknown } | null;
    holder?: { full_name?: unknown } | null;
    fields?: unknown;
  };
  const status = text(scan.meta?.status);
  if (status !== 'recognized') {
    throw new ScanKtpError(scanFailureMessage(status), 422);
  }

  const fields = Array.isArray(scan.fields) ? (scan.fields as ScanField[]) : [];
  const fullName = text(scan.holder?.full_name) ?? fieldValue(fields, 'full_name');
  const rawNumber = text(scan.document?.number) ?? fieldValue(fields, 'document_number');

  return {
    fullName,
    documentNumber: rawNumber ? digits(rawNumber) : null,
  };
}
