import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/auth_models.dart';

class AuthRepository {
  final ApiClient _api;
  final TokenStorage _tokens;
  AuthRepository(this._api, this._tokens);

  Future<void> _persist(Map<String, dynamic> res) async {
    await _tokens.save(
      accessToken: res['accessToken'] as String,
      refreshToken: res['refreshToken'] as String,
    );
  }

  Future<void> register(String email, String password, {String? displayName}) async {
    final res = await _api.post('/auth/register', {
      'email': email,
      'password': password,
      if (displayName != null) 'displayName': displayName,
    });
    await _persist(res as Map<String, dynamic>);
  }

  Future<void> login(String email, String password) async {
    final res = await _api.post('/auth/login', {'email': email, 'password': password});
    await _persist(res as Map<String, dynamic>);
  }

  Future<void> guest() async {
    final res = await _api.post('/auth/guest');
    await _persist(res as Map<String, dynamic>);
  }

  Future<AuthUser> me() async {
    final res = await _api.get('/users/me');
    return AuthUser.fromJson(res as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final refresh = await _tokens.refreshToken;
    if (refresh != null) {
      try {
        await _api.post('/auth/logout', {'refreshToken': refresh});
      } catch (_) {/* best-effort */}
    }
    await _tokens.clear();
  }

  Future<bool> hasSession() async => (await _tokens.accessToken) != null;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStorageProvider));
});
