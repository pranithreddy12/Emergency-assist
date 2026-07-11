import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';

class HospitalsRepository {
  final ApiClient _api;
  HospitalsRepository(this._api);

  Future<List<Map<String, dynamic>>> search({
    required double latitude,
    required double longitude,
    String? capability,
    String sort = 'distance',
    bool openNow = false,
    double radiusKm = 25,
    int limit = 10,
  }) async {
    final q = <String, String>{
      'latitude': '$latitude',
      'longitude': '$longitude',
      'sort': sort,
      'openNow': '$openNow',
      'radiusKm': '$radiusKm',
      'limit': '$limit',
      if (capability != null) 'capability': capability,
    };
    final query = q.entries.map((e) => '${e.key}=${Uri.encodeComponent(e.value)}').join('&');
    final res = await _api.get('/hospitals/search?$query');
    return ((res as Map<String, dynamic>)['hospitals'] as List).cast<Map<String, dynamic>>();
  }
}

final hospitalsRepositoryProvider = Provider<HospitalsRepository>((ref) {
  return HospitalsRepository(ref.watch(apiClientProvider));
});
