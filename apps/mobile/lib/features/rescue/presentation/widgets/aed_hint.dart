import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/rescue_theme.dart';
import '../../data/aed_repository.dart';

/// Slim banner on the CPR coach showing the nearest defibrillator + directions.
/// Silent until it resolves, and stays hidden if none is registered nearby.
class AedHint extends ConsumerWidget {
  const AedHint({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final aed = ref.watch(nearestAedProvider);
    return aed.maybeWhen(
      data: (a) => a == null ? const SizedBox.shrink() : _card(a),
      orElse: () => const SizedBox.shrink(),
    );
  }

  Widget _card(Map<String, dynamic> a) {
    final m = ((a['distanceKm'] as num) * 1000).round();
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Rescue.go.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Rescue.go.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.electric_bolt, color: Rescue.go, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nearest AED · $m m',
                    style: const TextStyle(color: Rescue.text, fontWeight: FontWeight.w800, fontSize: 14)),
                Text('${a['name']}${a['access'] != null ? ' — ${a['access']}' : ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Rescue.muted, fontSize: 12)),
              ],
            ),
          ),
          TextButton(
            onPressed: () => launchUrl(
              Uri.parse(
                  'https://www.google.com/maps/dir/?api=1&destination=${a['latitude']},${a['longitude']}'),
              mode: LaunchMode.externalApplication,
            ),
            child: const Text('Directions', style: TextStyle(color: Rescue.go, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
