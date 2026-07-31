import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';

class HospitalsRepository {
  final ApiClient _api;
  HospitalsRepository(this._api);

  /// Real nearby hospitals around the caller, live from OpenStreetMap.
  Future<List<Map<String, dynamic>>> nearby({
    required double latitude,
    required double longitude,
    int limit = 15,
  }) async {
    final res = await _api.get(
      '/places/nearby?type=hospital&latitude=$latitude&longitude=$longitude&radiusM=8000&limit=$limit',
    );
    return ((res as Map<String, dynamic>)['places'] as List).cast<Map<String, dynamic>>();
  }
}

final hospitalsRepositoryProvider = Provider<HospitalsRepository>((ref) {
  return HospitalsRepository(ref.watch(apiClientProvider));
});
