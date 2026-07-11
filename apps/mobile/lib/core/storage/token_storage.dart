import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists the JWT pair in the platform secure keystore.
class TokenStorage {
  static const _access = 'access_token';
  static const _refresh = 'refresh_token';
  final FlutterSecureStorage _store;

  TokenStorage([FlutterSecureStorage? store])
      : _store = store ?? const FlutterSecureStorage();

  Future<void> save({required String accessToken, required String refreshToken}) async {
    await _store.write(key: _access, value: accessToken);
    await _store.write(key: _refresh, value: refreshToken);
  }

  Future<String?> get accessToken => _store.read(key: _access);
  Future<String?> get refreshToken => _store.read(key: _refresh);

  Future<void> clear() async {
    await _store.delete(key: _access);
    await _store.delete(key: _refresh);
  }
}
