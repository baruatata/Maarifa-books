# MaarifaBooks Native App

This is the native Expo / React Native application. It does not embed the website in a WebView.

## Configuration

Set these public client values in the Expo/EAS environment used for the app:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the same Supabase project as the MaarifaBooks website. The publishable key is intended for client use; never put a Supabase service-role key or database password in the app. See `.env.example`.

## Current native milestone

- Loads approved books directly from the live `books` table.
- Searches by book title or author and filters by categories returned by Supabase.
- Loads signed cover URLs from the existing `book-files` Storage bucket.
- Shows native book details and uses the existing `get_seller_whatsapp` RPC for direct seller contact.
- Keeps seller-direct payment and the existing coupon-request workflow unchanged. The official book detail page opens externally for the existing sample and coupon-request steps.
- Does not invent cart, checkout gateway, author directory, community, or sample book data.

The mobile client relies on existing Supabase RLS and the public publishable key. No database schema, RLS policy, payment workflow, or Production deployment is changed by this milestone.

## Local development

1. Configure the two Expo public environment variables.
2. From this directory, run `npm install`.
3. Run `npx expo start` and open the project on a device with Expo Go or an emulator.
4. Run `npm run typecheck` before submitting changes.

## Builds

- Android preview profile creates an installable APK.
- Production profiles are reserved for an explicitly approved release.
- An Apple Developer Program membership is required for iOS store/TestFlight builds.
