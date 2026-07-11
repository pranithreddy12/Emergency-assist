import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/guidance_repository.dart';

class GuidanceDetailScreen extends ConsumerWidget {
  final String slug;
  const GuidanceDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(guidanceTopicProvider(slug));
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('First aid')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load topic.\n$e', textAlign: TextAlign.center)),
        data: (t) {
          final steps = (t['steps'] as List).cast<Map<String, dynamic>>();
          final donts = (t['donts'] as List).cast<String>();
          final callIf = (t['callEmergencyIf'] as List).cast<String>();
          final sources = (t['sources'] as List).cast<String>();
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(t['title'] as String,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(t['summary'] as String, style: TextStyle(color: scheme.onSurfaceVariant)),
              const SizedBox(height: 8),
              // When to call — always prominent.
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: scheme.errorContainer.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Icon(Icons.call, color: scheme.onErrorContainer, size: 20),
                      const SizedBox(width: 8),
                      Text('Call emergency services if',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, color: scheme.onErrorContainer)),
                    ]),
                    const SizedBox(height: 6),
                    ...callIf.map((c) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text('• $c', style: TextStyle(color: scheme.onErrorContainer)),
                        )),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text('Steps', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              ...steps.map((s) => Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: scheme.primaryContainer,
                        child: Text('${s['order']}'),
                      ),
                      title: Text(s['text'] as String),
                    ),
                  )),
              if (donts.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text("Don'ts", style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                ...donts.map((d) => ListTile(
                      leading: Icon(Icons.block, color: scheme.error),
                      title: Text(d),
                      dense: true,
                    )),
              ],
              const SizedBox(height: 12),
              Text('Sources: ${sources.join(", ")}',
                  style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
            ],
          );
        },
      ),
    );
  }
}
