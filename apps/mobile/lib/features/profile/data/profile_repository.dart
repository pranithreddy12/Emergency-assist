import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';

class ProfileRepository {
  final ApiClient _api;
  ProfileRepository(this._api);

  Future<Map<String, dynamic>> get() async {
    final res = await _api.get('/medical-profile');
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> update(Map<String, dynamic> patch) async {
    final res = await _api.put('/medical-profile', patch);
    return res as Map<String, dynamic>;
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(apiClientProvider));
});

/// Loads the current medical profile.
final profileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.watch(profileRepositoryProvider).get();
});
