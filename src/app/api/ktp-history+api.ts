import { isSmsPhone, normalizePhone } from '@/lib/phone';
import { isDummyOTPStep } from '@/lib/otp-step';
import { auth } from '@/server/auth';
import { downloadLatestKtp, latestKtpObject } from '@/server/upload-ktp';

function historyErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'Foto KTP terlalu besar.' || message === 'Foto KTP tidak valid') {
    return message;
  }
  return 'KTP histori tidak dapat diambil.';
}

function samePhone(left: string, right: string) {
  return normalizePhone(left) === normalizePhone(right);
}

async function requesterPhone(request: Request) {
  const requested = new URL(request.url).searchParams.get('phone');
  let sessionPhone: string | null = null;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const value = session?.user.phoneNumber;
    if (typeof value === 'string' && value.trim()) {
      const phone = normalizePhone(value);
      sessionPhone = isSmsPhone(phone) ? phone : null;
    }
  } catch (error) {
    console.error(error);
    if (!isDummyOTPStep) {
      throw error;
    }
  }

  if (sessionPhone) {
    if (requested && !samePhone(requested, sessionPhone)) {
      return null;
    }
    return sessionPhone;
  }

  if (!isDummyOTPStep || !requested) {
    return null;
  }
  const phone = normalizePhone(requested);
  return isSmsPhone(phone) ? phone : null;
}

export async function GET(request: Request) {
  let phone: string | null;
  try {
    phone = await requesterPhone(request);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'KTP histori tidak dapat diperiksa.' }, { status: 500 });
  }
  if (!phone) {
    return Response.json({ error: 'Masuk untuk menggunakan KTP histori.' }, { status: 401 });
  }

  const download = new URL(request.url).searchParams.get('download') === '1';

  try {
    if (!download) {
      const latest = await latestKtpObject(phone);
      return Response.json({ available: latest !== null });
    }

    const image = await downloadLatestKtp(phone);
    if (!image) {
      return Response.json({ error: 'KTP histori tidak ditemukan.' }, { status: 404 });
    }
    return Response.json(image);
  } catch (error) {
    console.error(error);
    return Response.json({ error: historyErrorMessage(error) }, { status: 500 });
  }
}
