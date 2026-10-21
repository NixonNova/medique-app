import { apiUrl } from '@/lib/api-url';

export type Clinic = {
  id: number;
  name: string;
};

export type WorkingDaySlotSummary = {
  date: string;
  verifiedBookingCount: number;
  totalSlotCount: number;
};

export type WorkingDayTimeSlot = {
  start: string;
  end: string;
  timeLabel: string;
  practitionerName: string | null;
  patients: string[];
  available: boolean;
};

export type WorkingDaySchedule = {
  date: string;
  timeSlots: WorkingDayTimeSlot[];
};

type ErrorBody = {
  error?: string;
};

async function errorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchClinics(): Promise<Clinic[]> {
  const response = await fetch(apiUrl('/api/clinics'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Klinik tidak dapat dimuat'));
  }
  const data = (await response.json()) as { clinics?: Clinic[] };
  return data.clinics ?? [];
}

export async function fetchWorkingDaySummaries(
  start: string,
  end: string,
  clinicId: number,
): Promise<WorkingDaySlotSummary[]> {
  const params = new URLSearchParams({
    start,
    end,
    clinicId: String(clinicId),
  });
  const response = await fetch(apiUrl(`/api/working-day-summaries?${params}`), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Jadwal tidak dapat dimuat'));
  }
  const data = (await response.json()) as { summaries?: WorkingDaySlotSummary[] };
  return data.summaries ?? [];
}

export type CreateBookingInput = {
  fullName: string;
  contactPhoneNumber: string;
  email: string;
  date: string;
  start: string;
  end: string;
};

export type BookingRecord = {
  id: number;
  bookingTime: string;
  bookingSlot: string | null;
  verified: boolean;
};

export async function fetchBookings(): Promise<BookingRecord[]> {
  const response = await fetch(apiUrl('/api/bookings'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Antrian tidak dapat dimuat'));
  }
  const data = (await response.json()) as { bookings?: BookingRecord[] };
  return data.bookings ?? [];
}

export async function createBooking(input: CreateBookingInput): Promise<{ id: number }> {
  const response = await fetch(apiUrl('/api/bookings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Antrian gagal disimpan'));
  }
  const data = (await response.json()) as { id?: number };
  if (!data.id) {
    throw new Error('Antrian gagal disimpan');
  }
  return { id: data.id };
}

export async function fetchWorkingDaySchedule(date: string, clinicId: number): Promise<WorkingDaySchedule> {
  const params = new URLSearchParams({
    date,
    clinicId: String(clinicId),
  });
  const response = await fetch(apiUrl(`/api/working-day-schedule?${params}`), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Jadwal jam tidak dapat dimuat'));
  }
  const data = (await response.json()) as { schedule?: WorkingDaySchedule };
  if (!data.schedule) {
    throw new Error('Jadwal jam tidak dapat dimuat');
  }
  return data.schedule;
}
