/// Build-time configuration. Override with:
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
class Env {
  /// Android emulator maps host loopback to 10.0.2.2; iOS sim uses localhost.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'http://10.0.2.2:3000/emergency',
  );
}
