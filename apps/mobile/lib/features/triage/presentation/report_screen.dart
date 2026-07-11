import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../emergency/data/emergency_repository.dart';
import '../domain/triage_models.dart';

class ReportScreen extends ConsumerStatefulWidget {
  final TriageResult result;
  final String? incidentId;
  const ReportScreen({super.key, required this.result, this.incidentId});

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  bool _alerting = false;
  String? _trackingLink;

  TriageResult get result => widget.result;

  Future<void> _alertContacts() async {
    final id = widget.incidentId;
    if (id == null) return;
    setState(() => _alerting = true);
    try {
      final res = await ref.read(emergencyRepositoryProvider).alertContacts(id);
      setState(() => _trackingLink = res['trackingLink'] as String?);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Alerted ${res['notified']} contact(s)')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _alerting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final sevColor = AppTheme.severityColor(result.severity, scheme);
    final pct = (result.confidence * 100).round();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency guidance'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Severity banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  colors: [sevColor, sevColor.withOpacity(0.75)],
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.priority_high, color: Colors.white, size: 40),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${result.severity} severity',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold)),
                        Text('Confidence $pct%  ·  engine: ${result.provider}',
                            style: const TextStyle(color: Colors.white70)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (result.suggestedFacility != null)
              Card(
                child: ListTile(
                  leading: Icon(Icons.local_hospital, color: scheme.primary),
                  title: const Text('Suggested facility'),
                  subtitle: Text(_facilityLabel(result.suggestedFacility!)),
                ),
              ),
            const SizedBox(height: 8),
            Text('First-aid steps', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            ...result.recommendedActions.asMap().entries.map(
                  (e) => Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: scheme.primaryContainer,
                        child: Text('${e.key + 1}'),
                      ),
                      title: Text(e.value),
                    ),
                  ),
                ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: scheme.errorContainer.withOpacity(0.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: scheme.onErrorContainer),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(result.disclaimer,
                        style: TextStyle(color: scheme.onErrorContainer)),
                  ),
                ],
              ),
            ),
            if (widget.incidentId != null) ...[
              const SizedBox(height: 20),
              Text('Emergency actions', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              FilledButton.tonalIcon(
                onPressed: _alerting ? null : _alertContacts,
                icon: _alerting
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.contact_phone),
                label: const Text('Alert my emergency contacts'),
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(50)),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => context.push('/hospitals'),
                icon: const Icon(Icons.local_hospital),
                label: const Text('Find & notify a hospital'),
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(50)),
              ),
              if (_trackingLink != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: scheme.secondaryContainer.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.link, color: scheme.onSecondaryContainer, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text('Live tracking link shared:\n$_trackingLink',
                            style: TextStyle(fontSize: 12, color: scheme.onSecondaryContainer)),
                      ),
                    ],
                  ),
                ),
              ],
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => context.go('/'),
              icon: const Icon(Icons.home),
              label: const Text('Back to dashboard'),
            ),
          ],
        ),
      ),
    );
  }

  String _facilityLabel(String code) {
    switch (code) {
      case 'CARDIAC':
        return 'Cardiac hospital';
      case 'STROKE':
        return 'Stroke center';
      case 'TRAUMA_CENTER':
        return 'Trauma center';
      case 'BURN':
        return 'Burn unit';
      case 'PEDIATRIC':
        return 'Pediatric hospital';
      default:
        return 'Nearest emergency department';
    }
  }
}
