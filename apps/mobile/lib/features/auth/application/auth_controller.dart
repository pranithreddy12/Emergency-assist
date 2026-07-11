import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../domain/auth_models.dart';

/// Authentication state consumed by the router redirect and screens.
sealed class AuthState {
  const AuthState();
}

class AuthUnknown extends AuthState {
  const AuthUnknown();
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthAuthenticated extends AuthState {
  final AuthUser user;
  const AuthAuthenticated(this.user);
}

class AuthController extends StateNotifier<AuthState> {
  final AuthRepository _repo;
  AuthController(this._repo) : super(const AuthUnknown()) {
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    if (await _repo.hasSession()) {
      try {
        state = AuthAuthenticated(await _repo.me());
        return;
      } catch (_) {/* fall through to unauth */}
    }
    state = const AuthUnauthenticated();
  }

  Future<void> loginEmail(String email, String password) async {
    await _repo.login(email, password);
    state = AuthAuthenticated(await _repo.me());
  }

  Future<void> register(String email, String password, {String? displayName}) async {
    await _repo.register(email, password, displayName: displayName);
    state = AuthAuthenticated(await _repo.me());
  }

  Future<void> continueAsGuest() async {
    await _repo.guest();
    state = AuthAuthenticated(await _repo.me());
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthUnauthenticated();
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.watch(authRepositoryProvider));
});
