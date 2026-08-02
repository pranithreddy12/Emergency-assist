import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// First-aid guidance is served from a bundled asset so "Learn first aid" works
/// with zero signal (matching Red Cross's offline promise). The asset is a
/// snapshot of the backend's /guidance/bundle — regenerate it when content
/// changes: `curl .../guidance/bundle -o assets/guidance.json`.
class GuidanceRepository {
  List<Map<String, dynamic>>? _topics;

  Future<List<Map<String, dynamic>>> _load() async {
    if (_topics != null) return _topics!;
    final raw = await rootBundle.loadString('assets/guidance.json');
    final bundle = jsonDecode(raw) as Map<String, dynamic>;
    return _topics = (bundle['topics'] as List).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> list() => _load();

  Future<Map<String, dynamic>> get(String slug) async {
    final topics = await _load();
    return topics.firstWhere((t) => t['slug'] == slug,
        orElse: () => throw StateError('Unknown guidance topic: $slug'));
  }
}

final guidanceRepositoryProvider = Provider<GuidanceRepository>((ref) {
  return GuidanceRepository();
});

final guidanceListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  return ref.watch(guidanceRepositoryProvider).list();
});

final guidanceTopicProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, slug) {
  return ref.watch(guidanceRepositoryProvider).get(slug);
});
