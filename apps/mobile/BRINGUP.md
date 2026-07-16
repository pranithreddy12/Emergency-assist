# EmergencyAI Mobile — Bring-up Checklist

The Flutter app (`apps/mobile`) was authored without a Flutter SDK on the build
host, so it has **not been compiled**. This checklist takes it from source to a
running app on a machine that has Flutter. Work top-to-bottom; each step says how
to verify it before moving on.

> The `lib/` code is complete (auth, SOS dashboard, AI triage, report, medical
> profile + QR, guidance, hospital search, ambulance, live location). What's
> missing is the generated native project (`android/`, `ios/`, …), platform
> permissions, and the native-SDK features (FCM push, social/biometric login).

---

## 0. Prerequisites

- [ ] **Flutter SDK** ≥ 3.22 (`flutter --version`)
- [ ] **Dart** ≥ 3.4 (bundled with Flutter)
- [ ] For Android: Android Studio + an emulator or a device with USB debugging
- [ ] For iOS (macOS only): Xcode + CocoaPods (`sudo gem install cocoapods`)
- [ ] Run `flutter doctor` and resolve anything with a ✗

```bash
cd apps/mobile
flutter doctor
```

---

## 1. Generate the native platform folders

The repo only tracks `lib/`, `test/`, `pubspec.yaml`, and `analysis_options.yaml`.
Generate the platform scaffolding **in place** (this does not overwrite `lib/`):

```bash
cd apps/mobile
flutter create . --org com.emergencyai --project-name emergencyai \
  --platforms=android,ios
# add ,web,windows,macos,linux if you want those targets too
```

- [ ] `android/` and `ios/` now exist
- [ ] `lib/main.dart` is untouched (git status shows only new native files)

---

## 2. Install dependencies

```bash
flutter pub get
```

- [ ] Completes with no version-resolution errors. If a plugin fails to resolve,
      note the constraint in `pubspec.yaml`:
      `flutter_riverpod ^2.5`, `go_router ^14.2`, `dio ^5.7`,
      `flutter_secure_storage ^9.2`, `socket_io_client ^2.0`, `qr_flutter ^4.1`,
      `geolocator ^13.0`.

---

## 3. Platform permissions & config

### Android — `android/app/src/main/AndroidManifest.xml`
Inside `<manifest>` (above `<application>`):
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```
- [ ] `minSdkVersion` ≥ 21 (geolocator + secure_storage). Set in
      `android/app/build.gradle` under `defaultConfig` if the default is lower.

### iOS — `ios/Runner/Info.plist`
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>EmergencyAI uses your location to find nearby hospitals and dispatch help.</string>
```
- [ ] iOS deployment target ≥ 12.0 (`ios/Podfile` `platform :ios, '12.0'`)
- [ ] `cd ios && pod install` succeeds (macOS)

---

## 4. Static analysis (fix the first real compile pass)

```bash
flutter analyze
```
- [ ] Zero errors. Expected *possible* warnings/infos to skim:
  - Unused imports if any screen changed — remove them.
  - `withOpacity` deprecation on Flutter ≥ 3.27 — safe to ignore, or bulk-swap to
    `.withValues(alpha:)` **only if** you're pinned to ≥ 3.27 (the code uses
    `withOpacity` deliberately for broad-version compatibility).
  - `CardTheme` vs `CardThemeData` — the theme intentionally omits a custom
    card theme to avoid this version-specific type. Leave as-is.
- [ ] `flutter test` (the unit tests in `test/`) is green.

> If `analyze` surfaces errors, paste them back and they can be fixed quickly —
> the code targets a stable API surface but a specific SDK version may differ.

---

## 5. Run against the backend

Start the backend first (see `../backend/README.md`) — it runs with zero keys.

```bash
# Android emulator reaches the host loopback via 10.0.2.2:
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 \
  --dart-define=WS_URL=http://10.0.2.2:3000/emergency

# iOS simulator / desktop use localhost:
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000/api/v1 \
  --dart-define=WS_URL=http://localhost:3000/emergency

# A physical device: use your machine's LAN IP, e.g. http://192.168.1.50:3000/...
# and set ALLOWED_ORIGINS on the backend if you tighten CORS.
```

### Android cleartext (HTTP in dev)
Release/newer Android blocks cleartext HTTP. For local dev against `http://`,
add to the `<application>` tag in `AndroidManifest.xml`:
```xml
android:usesCleartextTraffic="true"
```
(Remove for production — use HTTPS.)

---

## 6. Smoke-test the flows (manual QA)

- [ ] **Guest mode** — "Emergency Guest Mode" logs in and lands on the dashboard
- [ ] **Email register/login** — password needs a letter + number (backend policy)
- [ ] **SOS → triage** — big SOS button → 4-step assessment → report shows
      severity, confidence, first-aid steps, disclaimer
- [ ] **Location prompt** — first hospital/ambulance/SOS use asks for GPS
      permission; denying falls back to the demo location (no crash)
- [ ] **Hospital search** — list populates, filters/sort work
- [ ] **Ambulance** — book → status/ETA updates → cancel
- [ ] **Medical profile** — edit + save; QR card renders
- [ ] **Guidance** — 16 topics list → detail with steps
- [ ] **Alert contacts** (from report) — returns a tracking link (set contacts
      in the profile first)
- [ ] **Token refresh** — leave the app idle past the 15-min access-token TTL and
      confirm requests still work (Dio auto-refreshes)

---

## 7. Remaining native-SDK features (not yet wired — need config)

These were intentionally **not stubbed** (they can't work without real setup):

- [ ] **Firebase** (push + Crashlytics): `flutterfire configure`, add
      `firebase_core` + `firebase_messaging` + `firebase_crashlytics`, drop in
      `google-services.json` / `GoogleService-Info.plist`. Then wire an FCM token
      into the backend `notifications` (mock → `NOTIFY_PROVIDER=fcm`).
- [ ] **Google / Apple sign-in**: add `google_sign_in` / `sign_in_with_apple`,
      exchange the provider token with a new backend `/auth/oauth` endpoint
      (the `AuthProvider` enum already has `GOOGLE`/`APPLE`).
- [ ] **Biometric login**: add `local_auth`; gate re-open of a stored session
      behind a biometric check.
- [ ] **Shake / gesture SOS**: add `sensors_plus`; on a shake threshold, route to
      `/triage` (or straight to an SOS incident).

Each is a self-contained follow-up; the backend contracts they need already
exist (or are a small addition noted above).

---

## 8. Release builds (when ready)

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.your-domain.com/api/v1 \
  --dart-define=WS_URL=https://api.your-domain.com/emergency
flutter build ios --release   # then Archive in Xcode
```
- [ ] Point `API_BASE_URL`/`WS_URL` at your deployed backend (HTTPS)
- [ ] Set backend `ALLOWED_ORIGINS` and real provider keys (`*_PROVIDER`)
- [ ] Remove `usesCleartextTraffic` from the Android manifest
