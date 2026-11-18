import { get, list, put } from '@tigrisdata/storage';

import { isSmsPhone, normalizePhone } from '@/lib/phone';

const MAX_IMAGE_LENGTH = 8_000_000;
const S3_ENDPOINT = 'https://t3.storage.dev';
const IAM_ENDPOINT = 'https://iam.storage.dev';

export type KtpFile = {
  nik: string;
  bytes: Buffer;
};

function tigrisConfig() {
  const accessKeyId = process.env.TIGRIS_STORAGE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.TIGRIS_STORAGE_BUCKET?.trim();
  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Tigris storage is not configured');
  }
  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: process.env.TIGRIS_STORAGE_ENDPOINT?.trim() || S3_ENDPOINT,
    iamEndpoint: process.env.TIGRIS_STORAGE_IAM_ENDPOINT?.trim() || IAM_ENDPOINT,
  };
}

function ktpContentType(bytes: Buffer) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  return 'image/jpeg';
}

export function ktpObjectPath(phone: string, nik: string) {
  const folder = phone.replace(/\D/g, '');
  const fileName = nik.replace(/\D/g, '');
  if (!folder || !/^\d{16}$/.test(fileName)) {
    throw new Error('Foto KTP tidak valid');
  }
  return `${folder}/${fileName}.jpg`;
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

const MAX_IMAGE_BYTES = 6_000_000;

function ktpPhoneFolders(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = normalizePhone(digits);
  if (!isSmsPhone(normalized)) {
    return [];
  }
  const local = `0${normalized.slice(2)}`;
  return [...new Set([digits, normalized, local].filter((folder) => folder.length > 0))];
}

type StoredKtp = {
  path: string;
  fileName: string;
  modifiedAt: number;
};

async function listFolder(folder: string, config: ReturnType<typeof tigrisConfig>) {
  const items: StoredKtp[] = [];
  const seen = new Set<string>();
  let paginationToken: string | undefined;

  do {
    const page = await list({
      prefix: `${folder}/`,
      limit: 100,
      paginationToken,
      config,
    });
    if (page.error) {
      throw page.error;
    }

    for (const item of page.data?.items ?? []) {
      if (!item.name.startsWith(`${folder}/`) || item.name.endsWith('/') || item.size <= 0) {
        continue;
      }
      const fileName = item.name.slice(folder.length + 1);
      if (!fileName || fileName.includes('/') || fileName.includes('..')) {
        continue;
      }
      const modifiedAt = item.lastModified instanceof Date ? item.lastModified.getTime() : 0;
      items.push({
        path: item.name,
        fileName,
        modifiedAt: Number.isFinite(modifiedAt) ? modifiedAt : 0,
      });
    }

    const next = page.data?.hasMore ? page.data.paginationToken : undefined;
    if (!next || seen.has(next) || seen.size >= 20) {
      break;
    }
    seen.add(next);
    paginationToken = next;
  } while (paginationToken);

  return items;
}

export async function latestKtpObject(phone: string) {
  const folders = ktpPhoneFolders(phone);
  if (folders.length === 0) {
    return null;
  }

  const config = tigrisConfig();
  const found = (await Promise.all(folders.map((folder) => listFolder(folder, config)))).flat();
  found.sort((left, right) => right.modifiedAt - left.modifiedAt || right.path.localeCompare(left.path));
  return found[0] ?? null;
}

async function bytesFromStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  let locked = true;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) {
        break;
      }
      const chunk = Buffer.from(next.value);
      total += chunk.length;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        locked = false;
        throw new Error('Foto KTP terlalu besar.');
      }
      chunks.push(chunk);
    }
  } finally {
    if (locked) {
      reader.releaseLock();
    }
  }
  return Buffer.concat(chunks);
}

export async function downloadLatestKtp(phone: string) {
  const latest = await latestKtpObject(phone);
  if (!latest) {
    return null;
  }

  const folders = ktpPhoneFolders(phone);
  if (!folders.some((folder) => latest.path.startsWith(`${folder}/`))) {
    throw new Error('Foto KTP tidak valid');
  }

  const result = await get(latest.path, 'stream', { config: tigrisConfig() });
  if (result.error || !result.data) {
    throw result.error ?? new Error('KTP histori tidak dapat diambil.');
  }

  const bytes = await bytesFromStream(result.data);
  if (bytes.length === 0) {
    return null;
  }
  const base64 = bytes.toString('base64');
  if (base64.length > MAX_IMAGE_LENGTH) {
    throw new Error('Foto KTP terlalu besar.');
  }
  return { fileName: latest.fileName, base64 };
}

export async function uploadBookingKtp(phone: string, files: KtpFile[]) {
  if (files.length === 0) {
    return;
  }
  const config = tigrisConfig();
  for (const file of files) {
    const result = await put(ktpObjectPath(phone, file.nik), file.bytes, {
      access: 'private',
      allowOverwrite: true,
      contentType: ktpContentType(file.bytes),
      config,
    });
    if (result.error) {
      throw result.error;
    }
  }
}
