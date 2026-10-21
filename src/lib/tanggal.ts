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

export type MonthCell = {
  iso: string;
  day: number;
};

export function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso() {
  return formatIsoDate(new Date());
}

export function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

/** Inclusive first and last calendar day of the visible month. */
export function monthIsoBounds(date: Date) {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: formatIsoDate(startDate),
    end: formatIsoDate(endDate),
  };
}

export function formatTanggal(iso: string) {
  const date = parseIsoDate(iso);
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

function formatCalendarDay(year: string, month: string, day: string) {
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    return null;
  }
  return `${Number(day)} ${BULAN[monthIndex]} ${year}`;
}

/** BookingTime is stored as `YYYY-MM-DDTHH:mm:ss`. */
export function formatBookingTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return value;
  }
  const day = formatCalendarDay(match[1], match[2], match[3]);
  return day ? `${day}, ${match[4]}.${match[5]}` : value;
}

/** BookingSlot is stored as `YYYY-MM-DD HH:mm-HH:mm`. */
export function formatBookingSlot(value: string | null) {
  if (!value) {
    return '—';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return value;
  }
  const day = formatCalendarDay(match[1], match[2], match[3]);
  return day ? `${day}, ${match[4]}.${match[5]}–${match[6]}.${match[7]}` : value;
}

export function formatBulan(date: Date) {
  return `${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/** Monday-first month grid. Empty cells pad the first and last week. */
export function monthCells(month: Date): (MonthCell | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (MonthCell | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= count; day += 1) {
    cells.push({
      day,
      iso: formatIsoDate(new Date(year, monthIndex, day)),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}
