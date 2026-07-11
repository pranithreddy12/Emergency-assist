import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/guidance_repository.dart';

const _iconByName = {
  'favorite': Icons.favorite,
  'air': Icons.air,
  'monitor_heart': Icons.monitor_heart,
  'psychology': Icons.psychology,
  'bloodtype': Icons.bloodtype,
  'local_fire_department': Icons.local_fire_department,
  'electric_bolt': Icons.electric_bolt,
  'science': Icons.science,
  'pest_control': Icons.pest_control,
  'bolt': Icons.bolt,
  'healing': Icons.healing,
  'pool': Icons.pool,
  'thermostat': Icons.thermostat,
  'ac_unit': Icons.ac_unit,
  'child_care': Icons.child_care,
  'pregnant_woman': Icons.pregnant_woman,
};

class GuidanceListScreen extends ConsumerWidget {
  const GuidanceListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(guidanceListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('First-aid guidance')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load guidance.\n$e', textAlign: TextAlign.center)),
        data: (topics) => ListView.separated(
          padding: const EdgeInsets.all(12),
          itemCount: topics.length,
          separatorBuilder: (_, __) => const SizedBox(height: 4),
          itemBuilder: (context, i) {
            final t = topics[i];
            return Card(
              child: ListTile(
                leading: Icon(_iconByName[t['icon']] ?? Icons.medical_services,
                    color: Theme.of(context).colorScheme.primary),
                title: Text(t['title'] as String),
                subtitle: Text(t['summary'] as String,
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/guidance/${t['slug']}'),
              ),
            );
          },
        ),
      ),
    );
  }
}
