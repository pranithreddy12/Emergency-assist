import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/hospitals_repository.dart';
import '../../ambulance/presentation/ambulance_screen.dart';

// NOTE: live GPS is delivered by the Location module (a later phase). Until then
// this screen uses a demo location; swap in geolocator when Location lands.
const _demoLat = 37.7749;
const _demoLng = -122.4194;

const _capabilities = [
  null,
  'EMERGENCY',
  'TRAUMA_CENTER',
  'CARDIAC',
  'STROKE',
  'BURN',
  'PEDIATRIC',
];

class HospitalSearchScreen extends ConsumerStatefulWidget {
  const HospitalSearchScreen({super.key});
  @override
  ConsumerState<HospitalSearchScreen> createState() => _HospitalSearchScreenState();
}

class _HospitalSearchScreenState extends ConsumerState<HospitalSearchScreen> {
  String? _capability;
  String _sort = 'distance';
  bool _openNow = false;
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() {
    return ref.read(hospitalsRepositoryProvider).search(
          latitude: _demoLat,
          longitude: _demoLng,
          capability: _capability,
          sort: _sort,
          openNow: _openNow,
        );
  }

  void _refresh() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nearby hospitals')),
      body: Column(
        children: [
          _filters(),
          const Divider(height: 1),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) {
                  return Center(child: Text('Search failed.\n${snap.error}', textAlign: TextAlign.center));
                }
                final list = snap.data ?? [];
                if (list.isEmpty) {
                  return const Center(child: Text('No hospitals match these filters.'));
                }
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: list.length,
                  itemBuilder: (context, i) => _hospitalCard(list[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _filters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _capabilities.map((c) {
                final selected = _capability == c;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c == null ? 'All' : c.replaceAll('_', ' ')),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _capability = c);
                      _refresh();
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          Row(
            children: [
              DropdownButton<String>(
                value: _sort,
                items: const [
                  DropdownMenuItem(value: 'distance', child: Text('Distance')),
                  DropdownMenuItem(value: 'travelTime', child: Text('Travel time')),
                  DropdownMenuItem(value: 'rating', child: Text('Rating')),
                ],
                onChanged: (v) {
                  setState(() => _sort = v ?? 'distance');
                  _refresh();
                },
              ),
              const Spacer(),
              const Text('Open now'),
              Switch(
                value: _openNow,
                onChanged: (v) {
                  setState(() => _openNow = v);
                  _refresh();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _hospitalCard(Map<String, dynamic> h) {
    final scheme = Theme.of(context).colorScheme;
    final km = (h['distanceKm'] as num).toStringAsFixed(1);
    final mins = ((h['travelTimeSeconds'] as num) / 60).round();
    final caps = (h['capabilities'] as List).cast<String>();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(h['name'] as String,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                Icon(Icons.star, color: Colors.amber, size: 18),
                Text(' ${(h['rating'] as num).toStringAsFixed(1)}'),
              ],
            ),
            const SizedBox(height: 4),
            Text(h['address'] as String, style: TextStyle(color: scheme.onSurfaceVariant)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: caps
                  .map((c) => Chip(
                        label: Text(c.replaceAll('_', ' '), style: const TextStyle(fontSize: 11)),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      ))
                  .toList(),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.place, size: 16, color: scheme.primary),
                Text(' $km km'),
                const SizedBox(width: 12),
                Icon(Icons.directions_car, size: 16, color: scheme.primary),
                Text(' ~$mins min'),
                const Spacer(),
                FilledButton.tonalIcon(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => AmbulanceScreen(
                      destinationHospitalId: h['id'] as String,
                      destinationName: h['name'] as String,
                    ),
                  )),
                  icon: const Icon(Icons.local_shipping, size: 18),
                  label: const Text('Ambulance'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
