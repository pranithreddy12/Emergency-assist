import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';

/// First-aid guidance is public content; these calls work in guest mode too.
class GuidanceRepository {
  final ApiClient _api;
  GuidanceRepository(this._api);

  Future<List<Map<String, dynamic>>> list() async {
    final res = await _api.get('/guidance');
    return ((res as Map<String, dynamic>)['topics'] as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> get(String slug) async {
    final res = await _api.get('/guidance/$slug');
    return res as Map<String, dynamic>;
  }
}

final guidanceRepositoryProvider = Provider<GuidanceRepository>((ref) {
  return GuidanceRepository(ref.watch(apiClientProvider));
});

final guidanceListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  return ref.watch(guidanceRepositoryProvider).list();
});

final guidanceTopicProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) {
  return ref.watch(guidanceRepositoryProvider).get(slug);
});
