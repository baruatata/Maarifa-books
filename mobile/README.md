# MaarifaBooks Mobile App (Android + iPhone)

This Expo / React Native app shell opens the existing MaarifaBooks website in a controlled WebView. It reuses the current Supabase authentication, catalogue, reading, audio, seller and coupon workflows; it does not duplicate backend business logic.

## Platforms
- Android: preview profile builds an installable APK.
- iPhone: production profile builds an iOS App Store-compatible IPA for TestFlight submission.
- iOS bundle identifier: `com.maarifabooks.app`.

## iPhone / TestFlight requirements
An Apple Developer Program membership is required for a physical-device App Store/TestFlight build.

1. Confirm access to the Apple Developer account that will own the app.
2. From `mobile/`, sign in with `npx eas-cli login`.
3. Run `npx eas-cli credentials --platform ios` and configure the Apple Distribution certificate and provisioning profile, or allow EAS to manage them after signing in with the authorized Apple account.
4. Build the IPA with `npx eas-cli build --platform ios --profile production`.
5. Submit the build to App Store Connect/TestFlight with `npx eas-cli submit --platform ios` after App Store Connect access is configured.

Do not share Apple passwords or private keys in chat or commit them to GitHub. Use EAS-managed credentials / secure environment variables.

## Android build
1. Run `npm install` from this directory.
2. Build: `npx eas-cli build --platform android --profile preview`.
3. Download and install the APK from the EAS build page.

## Local development
1. Install Node.js 20 or newer.
2. Run `cd mobile && npm install`.
3. Run `npx expo start`.
4. Open with Expo Go or an emulator/simulator.

## Scope and safety
- No Supabase service-role key or other secret is included in the app.
- The website remains responsible for authentication and authorization.
- No database schema, RLS policy, payment workflow, or production website setting is changed by this app.
- This is a WebView-based mobile shell, not a native rewrite. OTP delivery, downloads, PDF/audio playback, navigation and iOS safe-area behavior must be tested on real devices before public release.
