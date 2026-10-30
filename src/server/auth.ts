import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { phoneNumber } from 'better-auth/plugins';
import { Pool } from 'pg';

import { isSmsPhone } from '@/lib/phone';
import { sendOtpWhatsApp } from '@/server/send-otp-whatsapp';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is not set');
}

const pool = new Pool({ connectionString, max: 5 });

export const auth = betterAuth({
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  database: pool,
  // The schema check starts when this module loads, before the first request
  // can create the patient tables.
  advanced: {
    database: {
      validateSchema: false,
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  user: {
    modelName: 'patient_user',
  },
  session: {
    modelName: 'patient_session',
  },
  account: {
    modelName: 'patient_account',
  },
  verification: {
    modelName: 'patient_verification',
  },
  trustedOrigins: [
    'mediqueapp://',
    'mediqueapp://*',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'exp://',
    'exp://**',
    'exp://192.168.*.*:*/**',
  ],
  plugins: [
    expo(),
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      phoneNumberValidator: (value) => isSmsPhone(value),
      signUpOnVerification: {
        getTempEmail: (value) => `${value.replace(/\D/g, '')}@phone.medique.local`,
        getTempName: (value) => value,
      },
      async sendOTP({ phoneNumber: destination, code }) {
        try {
          await sendOtpWhatsApp(destination, code);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'WhatsApp gagal dikirim';
          throw new APIError('BAD_REQUEST', { message });
        }
      },
    }),
  ],
});
