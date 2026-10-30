import { ScanKtpError, scanKtpImage } from '@/server/scan-ktp';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Foto KTP tidak valid.' }, { status: 400 });
  }

  const image = body && typeof body === 'object' && 'image' in body && typeof body.image === 'string' ? body.image : '';
  if (!image.trim()) {
    return Response.json({ error: 'Foto KTP tidak valid.' }, { status: 400 });
  }

  try {
    return Response.json(await scanKtpImage(image));
  } catch (error) {
    if (error instanceof ScanKtpError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: 'KTP tidak dapat dibaca.' }, { status: 500 });
  }
}
