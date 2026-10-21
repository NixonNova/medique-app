import { query } from '@/server/db';

type SummaryRow = {
  date: string;
  verifiedBookingCount: number | string | null;
  totalSlotCount: number | string | null;
};

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function asCount(value: number | string | null) {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const start = url.searchParams.get('start') ?? '';
  const end = url.searchParams.get('end') ?? '';
  const clinicIdText = url.searchParams.get('clinicId') ?? '';

  if (!isIsoDate(start) || !isIsoDate(end) || start > end) {
    return Response.json({ error: 'Rentang tanggal tidak valid' }, { status: 400 });
  }
  if (!/^\d+$/.test(clinicIdText) || Number(clinicIdText) <= 0) {
    return Response.json({ error: 'Klinik tidak valid' }, { status: 400 });
  }

  try {
    // Verified bookings are detail rows with a BookingID. Total slots are every detail row that day.
    const rows = await query<SummaryRow>(
      `
        SELECT
          h."Date" AS "date",
          COUNT(d."ID")::int AS "totalSlotCount",
          COALESCE(SUM(CASE WHEN d."BookingID" IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS "verifiedBookingCount"
        FROM "WorkingDayHeader" h
        LEFT JOIN "WorkingDayDetail" d ON d."Header" = h."ID"
        WHERE h."Date" >= $1
          AND h."Date" <= $2
          AND h."ClinicID" = $3
        GROUP BY h."ID", h."Date"
        ORDER BY h."Date" ASC
      `,
      [start, end, Number(clinicIdText)],
    );

    return Response.json({
      summaries: rows.map((row) => ({
        date: String(row.date).slice(0, 10),
        verifiedBookingCount: asCount(row.verifiedBookingCount),
        totalSlotCount: asCount(row.totalSlotCount),
      })),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Jadwal tidak dapat dimuat' }, { status: 500 });
  }
}
