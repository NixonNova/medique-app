# Medique

Medique is a clinic queue app for iPhone and Android. One React Native codebase serves both phones, so the same booking flow runs on either one. A patient picks a clinic, sees which days still have open slots, and takes a time before the schedule fills up.

The rest of the form stays closed until they sign in. Better Auth creates a six-digit code, and OTP.ID sends it to their email. Only then can they enter the patient's name, national ID number, and phone. A photo of the ID card is sent to the doc.cheap OCR API, which reads the name and document number so the patient does not have to type them. Someone booking for a family member can add the companion's details too. Each booking is saved on the clinic schedule, and a history screen shows whether the clinic has verified it.

## Stack

- Expo and React Native for iOS and Android, with Expo Router. The same screens also run on the web.
- TypeScript
- Better Auth, which creates the six-digit sign-in code
- OTP.ID, which sends OTP code to the patient via sms/whatsapp
- PostgreSQL
- doc.cheap, an OCR API for passport and ID card photos
- API routes in the same app for clinics, schedules, bookings, and sign-in

## Run

```bash
npm install
npx expo start
```

Use Expo Go on a phone, or run `npx expo start --web`.
