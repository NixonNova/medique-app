import { auth } from '@/server/auth';
import { ensureAuthSchema } from '@/server/ensure-auth-schema';

async function handle(request: Request) {
  try {
    await ensureAuthSchema();
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Auth tidak siap' }, { status: 500 });
  }
  return auth.handler(request);
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
