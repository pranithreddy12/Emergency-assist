import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/location/location_service.dart';
import '../../../core/providers.dart';

/// Nearest public-access defibrillator to the caller. Returns null if none is
/// registered nearby (the coach's spoken "go find an AED" cue covers that case).
final nearestAedProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final loc = await ref.watch(locationServiceProvider).current();
  final res = await ref.watch(apiClientProvider).get(
        '/aed/nearby?latitude=${loc.latitude}&longitude=${loc.longitude}&limit=1',
      );
  final list = (res as Map<String, dynamic>)['aeds'] as List;
  return list.isEmpty ? null : list.first as Map<String, dynamic>;
});
