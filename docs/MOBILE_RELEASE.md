# Mobile release checklist

## Firebase push

1. Add `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist` from the Budgii Firebase project. Keep both files out of Git.
2. In Firebase Console, upload an APNs authentication key for the iOS app.
3. Generate a Firebase service-account JSON key, store it in the deployment secret manager, and set `GOOGLE_APPLICATION_CREDENTIALS` to its mounted path.
4. Set `PUSH_PROVIDER=fcm` and `FCM_PROJECT_ID=budgii-2cd8d` in the API runtime environment.
5. Run `npm run cap:sync`, then test a real notification on Android and iOS hardware.

## Deep links

1. Host `https://budgii.app/.well-known/assetlinks.json` with Android package `app.mjproductions.budgii` and the release signing certificate SHA-256 fingerprint.
2. Add the `applinks:budgii.app` Associated Domains capability in Xcode and host `https://budgii.app/.well-known/apple-app-site-association` for the Apple team ID and bundle ID.
3. Verify `https://budgii.app/join?code=ABC123` opens Budgii and routes to the household join screen.

## Apple sign-in

1. Enable Sign in with Apple for `app.mjproductions.budgii` in Apple Developer.
2. Add the Sign in with Apple capability in Xcode. The iOS project is generated locally and intentionally ignored by Git.
3. Create an Apple Services ID for web sign-in, register the production return URL, and set `APPLE_CLIENT_ID` to that identifier in the API runtime environment.
4. Add native Apple sign-in after the Apple Developer identifiers are available; it requires the final team ID and entitlement profile.

## Signing and stores

1. Create the Android upload keystore and configure Play App Signing.
2. Configure the iOS signing team, provisioning profile, App Store Connect record, and privacy labels.
3. Replace development icons/splash assets, build signed release artifacts, and test camera, push, deep links, Google sign-in, and account recovery on real devices.
