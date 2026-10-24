# Medique

Medique is a clinic queue app for iPhone and Android. One React Native codebase serves both phones, so the same booking flow runs on either one. A patient picks a clinic, sees which days still have open slots, and takes a time before the schedule fills up.

The rest of the form stays closed until they sign in. A six-digit OTP code is sent to their email, and only then can they enter the patient's name, national ID number, and phone. Someone booking for a family member can add the companion's details too. Each booking is saved on the clinic schedule, and a history screen shows whether the clinic has verified it.

## Stack

- Expo and React Native for iOS and Android, with Expo Router. The same screens also run on the web.
- TypeScript
- Better Auth, with email one-time passwords
- PostgreSQL
- API routes in the same app for clinics, schedules, bookings, and sign-in

## Run

```bash
npm install
npx expo start
```

Use Expo Go on a phone, or run `npx expo start --web`.
