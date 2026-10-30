import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  emptyPatientForm,
  PatientDataForm,
  patientFormMessage,
  type PatientFormValue,
} from '@/components/patient-data-form';
import { Screen } from '@/components/screen';
import { SlotCalendar } from '@/components/slot-calendar';
import { TimeSlotList, timeSlotKey } from '@/components/time-slot-list';
import { authClient } from '@/lib/auth-client';
import { isDummyOTPStep } from '@/lib/otp-step';
import {
  createBooking,
  fetchClinics,
  fetchWorkingDaySchedule,
  fetchWorkingDaySummaries,
  type Clinic,
  type WorkingDaySlotSummary,
  type WorkingDayTimeSlot,
} from '@/lib/booking';
import { useAppState } from '@/state/app-state';
import { formatTanggal, monthIsoBounds, monthStart, shiftMonth, todayIso } from '@/lib/tanggal';

export default function AntriScreen() {
  const router = useRouter();
  const { tambahAntrian, dummyPhone, openLogin } = useAppState();
  const { data: session, isPending } = authClient.useSession();
  const sessionPhone = !isPending && session?.user.phoneNumber ? session.user.phoneNumber : null;
  const signedInPhone = isDummyOTPStep ? dummyPhone : sessionPhone;
  const today = todayIso();
  const requestId = useRef(0);
  const slotRequestId = useRef(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [clinicError, setClinicError] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));
  const [summaries, setSummaries] = useState<WorkingDaySlotSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<WorkingDayTimeSlot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientFormValue>(emptyPatientForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const patientValue = signedInPhone ? { ...patient, noTelp: signedInPhone } : patient;

  const loadSchedule = useCallback((nextClinicId: number, month: Date) => {
    const id = ++requestId.current;
    const bounds = monthIsoBounds(month);
    setScheduleLoading(true);
    setScheduleError(null);
    fetchWorkingDaySummaries(bounds.start, bounds.end, nextClinicId)
      .then((next) => {
        if (requestId.current !== id) {
          return;
        }
        setSummaries(next);
        setScheduleLoading(false);
      })
      .catch((error: unknown) => {
        if (requestId.current !== id) {
          return;
        }
        setSummaries([]);
        setScheduleError(error instanceof Error ? error.message : 'Jadwal tidak dapat dimuat');
        setScheduleLoading(false);
      });
  }, []);

  const loadSlots = useCallback((date: string, nextClinicId: number) => {
    const id = ++slotRequestId.current;
    setSlotsLoading(true);
    setSlotsError(null);
    setTimeSlots([]);
    setSelectedSlotKey(null);
    fetchWorkingDaySchedule(date, nextClinicId)
      .then((schedule) => {
        if (slotRequestId.current !== id) {
          return;
        }
        setTimeSlots(schedule.timeSlots);
        setSlotsLoading(false);
      })
      .catch((error: unknown) => {
        if (slotRequestId.current !== id) {
          return;
        }
        setTimeSlots([]);
        setSlotsError(error instanceof Error ? error.message : 'Jadwal jam tidak dapat dimuat');
        setSlotsLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchClinics()
        .then((next) => {
          if (!active) {
            return;
          }
          setClinics(next);
          setClinicError(null);
        })
        .catch((error: unknown) => {
          if (!active) {
            return;
          }
          setClinicError(error instanceof Error ? error.message : 'Klinik tidak dapat dimuat');
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const selectedClinic = clinics?.find((clinic) => clinic.id === clinicId) ?? null;
  const selectedSummary = summaries.find((summary) => summary.date === selectedDate) ?? null;
  const selectedSlot = timeSlots.find((slot) => timeSlotKey(slot) === selectedSlotKey) ?? null;
  const availableCount = selectedSummary
    ? selectedSummary.totalSlotCount - selectedSummary.verifiedBookingCount
    : 0;
  const canContinue = selectedDate !== null && selectedDate >= today && availableCount > 0;
  const canPickTime = selectedSlot !== null;
  const patientMessage = patientFormMessage(patientValue);
  const canSave = signedInPhone !== null && canPickTime && patientMessage === null && !saving;

  function chooseClinic(id: number) {
    setStep(1);
    setClinicId(id);
    setPickerOpen(false);
    setSelectedDate(null);
    loadSchedule(id, visibleMonth);
  }

  function changeMonth(delta: number) {
    const next = shiftMonth(visibleMonth, delta);
    const current = monthStart(new Date());
    if (
      next.getFullYear() < current.getFullYear() ||
      (next.getFullYear() === current.getFullYear() && next.getMonth() < current.getMonth())
    ) {
      return;
    }
    setVisibleMonth(next);
    setSelectedDate(null);
    setStep(1);
    if (clinicId !== null) {
      loadSchedule(clinicId, next);
    }
  }

  function reloadCalendar() {
    if (clinicId !== null) {
      loadSchedule(clinicId, visibleMonth);
    }
  }

  function updatePatient(patch: Partial<PatientFormValue>) {
    setPatient((current) => ({ ...current, ...patch }));
    setSaveError(null);
  }

  async function submitBooking() {
    if (!selectedDate || !selectedSlot || saving) {
      return;
    }
    const message = patientFormMessage(patientValue);
    if (message) {
      setSaveError(message);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createBooking({
        fullName: patientValue.namaPasien.trim(),
        contactPhoneNumber: patientValue.noTelp,
        date: selectedDate,
        start: selectedSlot.start,
        end: selectedSlot.end,
        ktpPasien: patientValue.ktpPasienBase64,
        ktpPengantre: patientValue.bukanPasien ? patientValue.ktpPengantreBase64 : null,
      });
      tambahAntrian({
        tanggal: formatTanggal(selectedDate),
        sesi: selectedSlot.timeLabel,
      });
      setPatient(emptyPatientForm);
      setSelectedDate(null);
      setSelectedSlotKey(null);
      setStep(1);
      setSaving(false);
      router.replace('/konfirmasi');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Antrian gagal disimpan');
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.stepBar}>
        <Text style={styles.stepText}>Langkah {step} dari 3</Text>
        <View style={styles.stepTrack}>
          <View
            style={[
              styles.stepFill,
              step === 2 ? styles.stepFillMid : null,
              step === 3 ? styles.stepFillDone : null,
            ]}
          />
        </View>
      </View>

      {step === 1 ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.label}>Tanggal Hari Ini</Text>
          <Text style={styles.value}>{formatTanggal(today)}</Text>

          <View style={styles.clinicBlock}>
            <Text style={styles.label}>Pilih Klinik:</Text>
            <Pressable
              accessibilityHint="Membuka daftar klinik"
              accessibilityLabel="Pilih Klinik"
              accessibilityRole="button"
              disabled={clinics === null || clinics.length === 0}
              onPress={() => setPickerOpen(true)}
              style={styles.dropdown}>
              <Text style={[styles.dropdownText, selectedClinic ? null : styles.placeholder]}>
                {clinicLabel(clinics, selectedClinic)}
              </Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
            {clinicError ? <Text style={styles.error}>{clinicError}</Text> : null}
          </View>

          {clinicId !== null ? (
            <SlotCalendar
              error={scheduleError}
              loading={scheduleLoading}
              onChangeMonth={changeMonth}
              onReload={reloadCalendar}
              onSelectDate={(date) => {
                if (date >= today) {
                  setSelectedDate(date);
                }
              }}
              selectedDate={selectedDate}
              summaries={summaries}
              visibleMonth={visibleMonth}
            />
          ) : null}
        </ScrollView>
      ) : null}

      {step === 2 ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.label}>Tanggal</Text>
          <Text style={styles.value}>{selectedDate ? formatTanggal(selectedDate) : '—'}</Text>
          <Text style={styles.clinicName}>{selectedClinic?.name}</Text>
          {selectedDate && clinicId !== null ? (
            <TimeSlotList
              error={slotsError}
              loading={slotsLoading}
              onReload={() => loadSlots(selectedDate, clinicId)}
              onSelect={(slot) => setSelectedSlotKey(timeSlotKey(slot))}
              selectedKey={selectedSlotKey}
              slots={timeSlots}
            />
          ) : null}
        </ScrollView>
      ) : null}

      {step === 3 ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}>
          <Text style={styles.heading}>Input Data Pasien</Text>
          <Text style={styles.label}>Tanggal</Text>
          <Text style={styles.value}>{selectedDate ? formatTanggal(selectedDate) : '—'}</Text>
          <Text style={styles.label}>Jam</Text>
          <Text style={styles.value}>{selectedSlot ? selectedSlot.timeLabel : '—'}</Text>
          <Text style={styles.clinicName}>{selectedClinic?.name}</Text>
          <PatientDataForm
            onChange={updatePatient}
            onGetOtp={() => openLogin(patient.noTelp.trim())}
            phoneReadOnly={signedInPhone !== null}
            value={patientValue}
          />
        </ScrollView>
      ) : null}

      {step === 1 ? (
        <View style={styles.footer}>
          {clinicId !== null ? <Text style={styles.status}>{scheduleStatus(selectedDate, selectedSummary)}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
            disabled={!canContinue}
            onPress={() => {
              if (clinicId === null || selectedDate === null) {
                return;
              }
              setStep(2);
              loadSlots(selectedDate, clinicId);
            }}
            style={[styles.button, canContinue ? null : styles.buttonDisabled]}>
            <Text style={[styles.buttonText, canContinue ? null : styles.buttonTextDisabled]}>Lanjut</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.footer}>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Tanggal</Text>
            <Text style={styles.summaryValue}>{selectedDate ? formatTanggal(selectedDate) : '—'}</Text>
            <Text style={styles.summaryLabel}>Jam</Text>
            <Text style={styles.summaryValue}>{selectedSlot ? selectedSlot.timeLabel : 'Belum dipilih'}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep(1)}
              style={[styles.button, styles.actionButton, styles.buttonSecondary]}>
              <Text style={styles.buttonSecondaryText}>Kembali</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canPickTime }}
              disabled={!canPickTime}
              onPress={() => setStep(3)}
              style={[styles.button, styles.actionButton, canPickTime ? null : styles.buttonDisabled]}>
              <Text style={[styles.buttonText, canPickTime ? null : styles.buttonTextDisabled]}>Lanjut</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.footer}>
          <Text style={saveError ? styles.error : styles.status}>
            {saveError ??
              (signedInPhone
                ? (patientMessage ?? 'Periksa data pasien, lalu kirim antrian.')
                : 'Masuk dengan OTP untuk mengisi data pasien.')}
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => setStep(2)}
              style={[styles.button, styles.actionButton, styles.buttonSecondary]}>
              <Text style={styles.buttonSecondaryText}>Kembali</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={submitBooking}
              style={[styles.button, styles.actionButton, canSave ? null : styles.buttonDisabled]}>
              <Text style={[styles.buttonText, canSave ? null : styles.buttonTextDisabled]}>
                {saving ? 'Menyimpan...' : 'Submit Antrian'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Modal animationType="fade" onRequestClose={() => setPickerOpen(false)} transparent visible={pickerOpen}>
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel="Tutup daftar klinik" onPress={() => setPickerOpen(false)} style={styles.backdropTap} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Pilih Klinik</Text>
            <ScrollView style={styles.sheetList}>
              {(clinics ?? []).map((clinic) => {
                const selected = clinic.id === clinicId;
                return (
                  <Pressable
                    key={clinic.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => chooseClinic(clinic.id)}
                    style={[styles.option, selected ? styles.optionSelected : null]}>
                    <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{clinic.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function clinicLabel(clinics: Clinic[] | null, selected: Clinic | null) {
  if (selected) {
    return selected.name;
  }
  if (clinics === null) {
    return 'Memuat...';
  }
  if (clinics.length === 0) {
    return 'Tidak ada klinik';
  }
  return 'Pilih klinik';
}

function scheduleStatus(selectedDate: string | null, summary: WorkingDaySlotSummary | null) {
  if (!selectedDate) {
    return 'Pilih tanggal pada kalender.';
  }
  if (selectedDate < todayIso()) {
    return 'Tanggal yang sudah lewat tidak dapat dipilih.';
  }
  if (!summary || summary.totalSlotCount <= 0) {
    return 'Tidak ada slot pada tanggal ini.';
  }
  const available = summary.totalSlotCount - summary.verifiedBookingCount;
  if (available <= 0) {
    return 'Slot pada tanggal ini sudah penuh.';
  }
  return `${available} slot tersedia.`;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#1C2430',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2430',
  },
  clinicBlock: {
    marginTop: 12,
    gap: 8,
  },
  dropdown: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D5DBE3',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#1C2430',
  },
  placeholder: {
    color: '#8B95A5',
  },
  chevron: {
    fontSize: 14,
    color: '#5C6778',
  },
  error: {
    fontSize: 13,
    color: '#9B2335',
  },
  stepBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F4E5F',
  },
  stepTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3E7EE',
    overflow: 'hidden',
  },
  stepFill: {
    width: '33.33%',
    height: '100%',
    backgroundColor: '#1F4E5F',
  },
  stepFillMid: {
    width: '66.66%',
  },
  stepFillDone: {
    width: '100%',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C2430',
    marginBottom: 4,
  },
  clinicName: {
    fontSize: 14,
    color: '#5C6778',
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E3E7EE',
    backgroundColor: '#FFFFFF',
  },
  summary: {
    gap: 2,
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#5C6778',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2430',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3F4A5A',
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  actionButton: {
    flex: 1,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1F4E5F',
  },
  buttonSecondaryText: {
    color: '#1F4E5F',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#E3E7EE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#8B95A5',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(28, 36, 48, 0.4)',
  },
  backdropTap: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '70%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sheetTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2430',
  },
  sheetList: {
    flexGrow: 0,
  },
  option: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: '#E7F0F3',
  },
  optionText: {
    fontSize: 16,
    color: '#1C2430',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1F4E5F',
  },
});
