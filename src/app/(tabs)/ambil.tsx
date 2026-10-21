import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { emptyPatientForm, PatientDataForm, type PatientFormValue } from '@/components/patient-data-form';
import { Screen } from '@/components/screen';
import { useAppState } from '@/state/app-state';

export default function AmbilScreen() {
  const router = useRouter();
  const { tambahAntrian } = useAppState();
  const [patient, setPatient] = useState<PatientFormValue>(emptyPatientForm);

  function updatePatient(patch: Partial<PatientFormValue>) {
    setPatient((current) => ({ ...current, ...patch }));
  }

  function submit() {
    tambahAntrian();
    router.replace('/konfirmasi');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PatientDataForm onChange={updatePatient} value={patient} />
        <Pressable accessibilityRole="button" onPress={submit} style={styles.submit}>
          <Text style={styles.submitText}>Submit Antrian</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  submit: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F4E5F',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
