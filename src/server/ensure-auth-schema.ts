import { getMigrations } from 'better-auth/db/migration';

import { auth } from '@/server/auth';

const allowedTables = new Set([
  'patient_user',
  'patient_session',
  'patient_account',
  'patient_verification',
]);

let ready: Promise<void> | undefined;

function tableName(value: string) {
  return value.split('.').pop()?.replaceAll('"', '') ?? value;
}

export function ensureAuthSchema() {
  ready ??= migrate().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

async function migrate() {
  const plan = await getMigrations(auth.options);
  const tables = [
    ...plan.toBeCreated.map((entry) => tableName(entry.table)),
    ...plan.toBeAdded.map((entry) => entry.table),
    ...plan.toBeAddedIndexes.map((entry) => entry.table),
  ].map(tableName);

  const unexpected = tables.filter((table) => !allowedTables.has(table));
  if (unexpected.length > 0) {
    throw new Error(`Refusing to change unexpected auth tables: ${unexpected.join(', ')}`);
  }

  if (plan.toBeCreated.length === 0 && plan.toBeAdded.length === 0 && plan.toBeAddedIndexes.length === 0) {
    return;
  }

  await plan.runMigrations();
}
