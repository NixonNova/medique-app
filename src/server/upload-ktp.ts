import { createFolder, del, list, put } from '@vercel/blob';

const MAX_IMAGE_LENGTH = 8_000_000;

type BlobAuth = {
  token?: string;
  storeId: string;
};

function storeIdFromToken(token: string) {
  const [, , , storeId = ''] = token.split('_');
  return storeId;
}

function blobAuth(): BlobAuth {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim().replace(/^store_/, '');
  // #region agent log
  fetch('http://127.0.0.1:7547/ingest/8186d3d5-2ed3-41ae-9776-0c107397ca4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34efc1'},body:JSON.stringify({sessionId:'34efc1',runId:'pre-fix',hypothesisId:'A-D',location:'upload-ktp.ts:blobAuth',message:'blob credential presence',data:{tokenPresent:Boolean(token),storeIdPresent:Boolean(storeId),tokenLength:token?.length??0,storeIdLength:storeId?.length??0,blobEnvKeys:Object.keys(process.env).filter((key)=>/blob|store/i.test(key))},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const oidcPresent = Boolean(process.env.VERCEL_OIDC_TOKEN?.trim());
  const mode = token && storeId ? 'read-write' : storeId && oidcPresent ? 'oidc' : 'missing';
  // #region agent log
  fetch('http://127.0.0.1:7547/ingest/8186d3d5-2ed3-41ae-9776-0c107397ca4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'34efc1'},body:JSON.stringify({sessionId:'34efc1',runId:'post-fix',hypothesisId:'E',location:'upload-ktp.ts:blobAuth:mode',message:'blob auth mode',data:{mode,oidcPresent,tokenPresent:Boolean(token),storeIdPresent:Boolean(storeId)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (token && storeId) {
    if (storeIdFromToken(token) !== storeId) {
      throw new Error('Blob store id does not match the read-write token');
    }
    return { token, storeId };
  }
  if (storeId && oidcPresent) {
    return { storeId };
  }
  throw new Error('Blob storage is not configured');
}

function blobCommand(auth: BlobAuth) {
  return {
    storeId: auth.storeId,
    ...(auth.token ? { token: auth.token } : {}),
  };
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

async function phoneFolderExists(phone: string, auth: BlobAuth) {
  const existing = await list({
    prefix: `${phone}/`,
    limit: 1,
    ...blobCommand(auth),
  });
  return existing.blobs.length > 0;
}

async function ensurePhoneFolder(phone: string, auth: BlobAuth) {
  if (await phoneFolderExists(phone, auth)) {
    return;
  }
  try {
    await createFolder(`${phone}/`, {
      access: 'private',
      ...(auth.token ? { token: auth.token } : {}),
    });
  } catch (error) {
    if (!(await phoneFolderExists(phone, auth))) {
      throw error;
    }
  }
}

async function putKtp(phone: string, fileName: string, bytes: Buffer, auth: BlobAuth) {
  const blob = await put(`${phone}/${fileName}`, new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }), {
    access: 'private',
    contentType: 'image/jpeg',
    ...blobCommand(auth),
  });
  return blob.url;
}

export async function uploadBookingKtp(phone: string, pasien: Buffer | null, pengantre: Buffer | null) {
  if (!pasien && !pengantre) {
    return [];
  }
  const auth = blobAuth();
  await ensurePhoneFolder(phone, auth);
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
      await del(uploaded, blobCommand(auth)).catch((cleanupError) => {
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
  await del(urls, blobCommand(auth));
}
