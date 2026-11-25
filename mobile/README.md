# MaarifaBooks Android App

This is an Android application shell built with Expo and React Native. It opens the existing MaarifaBooks production website inside a controlled WebView, so current Supabase authentication, catalogue, reading, audio, and coupon workflows remain on the existing backend.

## Why this first version uses a WebView

- Reuses the existing production application and its tested business rules.
- Avoids duplicating authentication, payment/coupon, seller, and admin logic.
- Keeps the Android app isolated in `mobile/`; it does not change the Next.js website or database.
- External links such as WhatsApp, phone, and email are opened by Android.

This is an initial reader-facing APK shell, not a full native rewrite. PDF/audio behavior, OTP delivery, downloads, and Android navigation must be checked on physical Android devices before release.

## Local development

1. Install Node.js 20 or newer.
2. Run `cd mobile && npm install`.
3. Run `npx expo start`.
4. Open using Expo Go or an Android emulator.

## Build an installable APK

1. Install dependencies: `npm install`.
2. Sign in to the Expo account configured as the project owner (`lumbwadigital`): `npx eas-cli login`.
3. Initialize/link the EAS project and let Expo write the real project ID into `app.json`: `npx eas-cli init`.
4. Build an installable APK: `npx eas-cli build --platform android --profile preview`.
5. Download the APK from the build page after EAS reports a successful build.

Do not commit Expo passwords, access tokens, or signing secrets to GitHub. The `owner` field is already set to `lumbwadigital`; `eas init` still needs to link this app to an actual EAS project.

The production profile creates an Android App Bundle for a future Google Play release.

## Security and scope

- No Supabase service-role key or other secret is included in the app.
- The website remains responsible for authentication and access control.
- No database schema, RLS policy, payment workflow, or production website setting is changed by this app shell.
