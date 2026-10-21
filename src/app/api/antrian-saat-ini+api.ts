import { query } from '@/server/db';

type SlotRow = {
  ID: number | string;
  Start: string;
  End: string;
  Date: string;
};

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

function formatJam(value: string) {
  const [hour = '0', minute = '00'] = value.split(':');
  return `${hour.padStart(2, '0')}.${minute.padStart(2, '0')}`;
}

function formatSlot(row: SlotRow) {
  const [year, month, day] = row.Date.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${HARI[date.getDay()]}, ${day} ${BULAN[month - 1]} ${year}, ${formatJam(row.Start)}–${formatJam(row.End)}`;
}

export async function GET() {
  try {
    const rows = await query<SlotRow>(`
      SELECT d."ID", d."Start", d."End", h."Date"
      FROM "WorkingDayDetail" d
      JOIN "WorkingDayHeader" h ON h."ID" = d."Header"
      WHERE d."BookingID" IS NULL
      ORDER BY d."ID" ASC
      LIMIT 1
    `);
    const row = rows[0];
    if (!row) {
      return Response.json({ id: null, label: null });
    }
    return Response.json({ id: Number(row.ID), label: formatSlot(row) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Gagal memuat antrian' }, { status: 500 });
  }
}
