import { query } from '@/server/db';

type BookingIdRow = {
  id: number | string;
};

type BookingListRow = {
  id: number | string;
  bookingTime: string;
  bookingSlot: string | null;
  verifiedOn: string | null;
};

function isVerified(value: string | null) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function toIsoDateTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export async function GET() {
  try {
    const rows = await query<BookingListRow>(`
      SELECT
        "ID" AS "id",
        "BookingTime" AS "bookingTime",
        "BookingSlot" AS "bookingSlot",
        "VerifiedOn" AS "verifiedOn"
      FROM "Booking"
      ORDER BY "ID" DESC
    `);

    return Response.json({
      bookings: rows.map((row) => ({
        id: Number(row.id),
        bookingTime: row.bookingTime,
        bookingSlot: row.bookingSlot,
        verified: isVerified(row.verifiedOn),
      })),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Antrian tidak dapat dimuat' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Data pasien tidak lengkap' }, { status: 400 });
  }

  const payload = body as {
    fullName?: unknown;
    contactPhoneNumber?: unknown;
    email?: unknown;
    date?: unknown;
    start?: unknown;
    end?: unknown;
  };
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
  const contactPhoneNumber =
    typeof payload.contactPhoneNumber === 'string' ? payload.contactPhoneNumber.replace(/\D/g, '') : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const date = typeof payload.date === 'string' ? payload.date : '';
  const start = typeof payload.start === 'string' ? payload.start : '';
  const end = typeof payload.end === 'string' ? payload.end : '';

  if (
    !fullName ||
    fullName.length > 200 ||
    contactPhoneNumber.length < 10 ||
    contactPhoneNumber.length > 15 ||
    !isEmail(email) ||
    !isIsoDate(date) ||
    !isTime(start) ||
    !isTime(end) ||
    start >= end
  ) {
    return Response.json({ error: 'Data pasien tidak lengkap' }, { status: 400 });
  }

  try {
    const rows = await query<BookingIdRow>(
      `
        INSERT INTO "Booking" ("BookingTime", "FullName", "BookingSlot", "ContactPhoneNumber", "Email")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING "ID" AS id
      `,
      [toIsoDateTime(new Date()), fullName, `${date} ${start}-${end}`, contactPhoneNumber, email],
    );
    const id = Number(rows[0]?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'Antrian gagal disimpan' }, { status: 500 });
    }
    return Response.json({ id });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Antrian gagal disimpan' }, { status: 500 });
  }
}
