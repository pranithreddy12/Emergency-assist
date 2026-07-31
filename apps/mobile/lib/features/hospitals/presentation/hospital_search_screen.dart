import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/location/location_service.dart';
import '../data/hospitals_repository.dart';

/// Real nearby hospitals around the caller (live from OpenStreetMap).
class HospitalSearchScreen extends ConsumerStatefulWidget {
  const HospitalSearchScreen({super.key});
  @override
  ConsumerState<HospitalSearchScreen> createState() => _HospitalSearchScreenState();
}

class _HospitalSearchScreenState extends ConsumerState<HospitalSearchScreen> {
  late Future<List<Map<String, dynamic>>> _future = _load();

  Future<List<Map<String, dynamic>>> _load() async {
    final loc = await ref.read(locationServiceProvider).current();
    return ref.read(hospitalsRepositoryProvider).nearby(
          latitude: loc.latitude,
          longitude: loc.longitude,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby hospitals'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() => _future = _load()),
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Could not load hospitals.\n${snap.error}', textAlign: TextAlign.center));
          }
          final list = snap.data ?? [];
          if (list.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('No hospitals found nearby right now. Call your local emergency number.',
                    textAlign: TextAlign.center),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            itemBuilder: (context, i) => _card(list[i]),
          );
        },
      ),
    );
  }

  Widget _card(Map<String, dynamic> h) {
    final scheme = Theme.of(context).colorScheme;
    final km = (h['distanceKm'] as num).toStringAsFixed(1);
    final address = h['address'] as String?;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(h['name'] as String? ?? 'Hospital',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  if (address != null && address.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(address, style: TextStyle(color: scheme.onSurfaceVariant)),
                  ],
                  const SizedBox(height: 8),
                  Row(children: [
                    Icon(Icons.place, size: 16, color: scheme.primary),
                    Text(' $km km'),
                  ]),
                ],
              ),
            ),
            FilledButton.tonalIcon(
              onPressed: () => launchUrl(
                Uri.parse(
                    'https://www.google.com/maps/dir/?api=1&destination=${h['latitude']},${h['longitude']}'),
                mode: LaunchMode.externalApplication,
              ),
              icon: const Icon(Icons.directions, size: 18),
              label: const Text('Directions'),
            ),
          ],
        ),
      ),
    );
  }
}
