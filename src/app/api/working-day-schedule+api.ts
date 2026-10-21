import { query } from '@/server/db';

type ScheduleRow = {
  start: string;
  end: string;
  patientName: string | null;
  practitionerName: string | null;
};

type GroupedSlot = {
  start: string;
  end: string;
  timeLabel: string;
  practitionerName: string | null;
  patients: string[];
  available: boolean;
};

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function normalizeTime(value: string) {
  const [hour = '0', minute = '00'] = String(value).split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0').slice(0, 2)}`;
}

function formatJam(value: string) {
  const [hour = '00', minute = '00'] = normalizeTime(value).split(':');
  return `${hour}.${minute}`;
}

function groupSlots(rows: ScheduleRow[]): GroupedSlot[] {
  const grouped = new Map<string, GroupedSlot>();

  for (const row of rows) {
    const start = normalizeTime(row.start);
    const end = normalizeTime(row.end);
    const key = `${start}\0${end}`;
    const practitionerName = row.practitionerName?.trim() || null;
    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        start,
        end,
        timeLabel: `${formatJam(start)}–${formatJam(end)}`,
        practitionerName,
        patients: [],
        available: false,
      };
      grouped.set(key, entry);
    } else if (!entry.practitionerName && practitionerName) {
      entry.practitionerName = practitionerName;
    }
    if (row.patientName) {
      entry.patients.push(row.patientName);
    } else {
      entry.available = true;
    }
  }

  return [...grouped.values()];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') ?? '';
  const clinicIdText = url.searchParams.get('clinicId') ?? '';

  if (!isIsoDate(date)) {
    return Response.json({ error: 'Tanggal tidak valid' }, { status: 400 });
  }
  if (!/^\d+$/.test(clinicIdText) || Number(clinicIdText) <= 0) {
    return Response.json({ error: 'Klinik tidak valid' }, { status: 400 });
  }

  try {
    const rows = await query<ScheduleRow>(
      `
        SELECT
          d."Start" AS "start",
          d."End" AS "end",
          b."FullName" AS "patientName",
          practitioner.name AS "practitionerName"
        FROM "WorkingDayHeader" h
        INNER JOIN "WorkingDayDetail" d ON d."Header" = h."ID"
        LEFT JOIN "Booking" b ON b."ID" = d."BookingID"
        LEFT JOIN "user" practitioner ON practitioner.id = d."UserID"
        WHERE h."Date" = $1
          AND h."ClinicID" = $2
        ORDER BY d."Start" ASC, d."End" ASC, d."Slot" ASC
      `,
      [date, Number(clinicIdText)],
    );

    return Response.json({
      schedule: {
        date,
        timeSlots: groupSlots(rows),
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Jadwal jam tidak dapat dimuat' }, { status: 500 });
  }
}
