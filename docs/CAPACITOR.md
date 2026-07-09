# Budgii — Capacitor (iOS & Android)

Budgii ships as a web bundle (`dist/`) wrapped by Electron (desktop) and Capacitor (mobile). The same React app and hash router are used on all platforms. In API mode, authenticated household data syncs through the FastAPI backend; `localStorage` remains the Zustand cache/offline fallback and stores local-only state such as the app PIN.

## Prerequisites

- Node.js (same as the main project)
- **iOS:** macOS, Xcode, CocoaPods (`sudo gem install cocoapods`)
- **Android:** Android Studio, Android SDK, JDK 17+

## First-time setup

```bash
npm install
npm run build
npx cap add ios      # once per machine / after cloning if ios/ is not in repo
npx cap add android  # once per machine / after cloning if android/ is not in repo
npm run cap:sync
```

Native projects (`ios/`, `android/`) are gitignored and regenerated locally with `cap add`. Commit `capacitor.config.ts` and web source only.

For API-backed mobile testing, set `VITE_API_ENABLED=true` and point
`VITE_API_BASE_URL` at a backend URL the device can reach. `localhost` inside a
phone/simulator is not the Docker host unless you are using platform-specific
network aliases or a LAN/tunnel URL.

## Native camera

Receipt scanning uses `@capacitor/camera` on iOS/Android and falls back to a browser file input on web/Electron.

After regenerating `ios/`, add these usage descriptions to `ios/App/App/Info.plist` before running on device:

```xml
<key>NSCameraUsageDescription</key>
<string>Budgii uses the camera to capture receipt photos for item extraction.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Budgii lets you choose receipt photos from your library.</string>
```

The iOS Simulator can install and launch the app, but proper camera capture requires a physical iPhone.

## Scripts

| Script                | What it does                        |
| --------------------- | ----------------------------------- |
| `npm run cap:build`   | `tsc` + Vite build, then `cap sync` |
| `npm run cap:sync`    | Copy `dist/` into native projects   |
| `npm run cap:ios`     | Open Xcode workspace                |
| `npm run cap:android` | Open Android Studio project         |

## Dev workflow

1. Change web code in `src/`
2. `npm run cap:build` (or `npm run build && npm run cap:sync`)
3. Run from Xcode or Android Studio, or use CLI:

```bash
npx cap run ios
npx cap run android
```

### Live reload (optional)

Point Capacitor at the Vite dev server by temporarily adding to `capacitor.config.ts`:

```ts
server: {
  url: 'http://YOUR_LAN_IP:5173',
  cleartext: true,
},
```

Revert before release builds. Electron dev scripts are unchanged.

## Deep links

Universal link target (configured later in Apple/Google consoles):

`https://budgii.app/join?code=ABC123`

The app listens via `@capacitor/app` and routes to `#/join-family?code=ABC123`. Native associated-domains / intent-filter setup is still TODO — see `src/capacitor/deepLinks.ts`.

## Electron

Electron builds are separate and unaffected:

- `npm run electron:dev:app` / `electron:dev:qa`
- `npm run electron:dist:app` / `electron:dist:qa`

## Troubleshooting

- **Blank WebView:** Run `npm run cap:build` so `dist/` exists before sync.
- **Stale assets:** `npx cap sync` after every web build.
- **iOS pod errors:** `cd ios/App && pod install`
- **Android Gradle:** Open in Android Studio and let it sync SDK/Gradle versions.
