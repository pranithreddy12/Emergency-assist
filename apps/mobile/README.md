# EmergencyAI — Mobile (Flutter)

Material 3 · Riverpod · GoRouter · Dio.

## Vertical slice implemented
`Login / Emergency Guest Mode` → `SOS Dashboard` (large pulsing SOS button) →
`Guided AI triage` (what happened / conscious / breathing / bleeding) →
`Structured guidance report` (severity, confidence, first-aid steps, facility, disclaimer),
plus a `Medical profile` screen with a scannable **emergency QR card**.

## Architecture (clean, feature-first)
```
lib/
  core/           config, theme, network (Dio + auto-refresh), secure storage, providers
  features/
    auth/         data · domain · application (Riverpod) · presentation
    emergency/    SOS dashboard + incident repository
    triage/       models · guided flow · report
    profile/      medical profile + QR card
  routing/        GoRouter with auth-aware redirect
```

## Live location
The hospital search, ambulance booking, and SOS flows use real GPS via
`geolocator` (`lib/core/location/location_service.dart`), with a graceful
fallback to a default location if permission is denied or GPS is off.

Add the platform permissions after generating the native folders
(`flutter create .` if `android/`/`ios/` don't exist yet):

- **Android** — in `android/app/src/main/AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  ```
- **iOS** — in `ios/Runner/Info.plist`:
  ```xml
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>EmergencyAI uses your location to find nearby hospitals and dispatch help.</string>
  ```

## Run
```bash
# 1. Start the backend first (see ../backend/README.md) — it runs with zero keys.
# 2. Point the app at it. Android emulator reaches the host via 10.0.2.2:
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 \
            --dart-define=WS_URL=http://10.0.2.2:3000/emergency
# iOS simulator / desktop: use http://localhost:3000/...
```

## Test
```bash
flutter test
```

> This host had no Flutter SDK installed, so this code was authored but not
> compiled here. Run `flutter analyze` on a machine with Flutter to confirm.
