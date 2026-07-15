import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/location/location_service.dart';
import '../../../core/network/api_client.dart';
import '../../emergency/data/emergency_repository.dart';
import '../domain/triage_models.dart';

/// Guided emergency assessment. Collects the structured questions the triage
/// engine expects, then raises an SOS and routes to the report.
class TriageScreen extends ConsumerStatefulWidget {
  const TriageScreen({super.key});
  @override
  ConsumerState<TriageScreen> createState() => _TriageScreenState();
}

class _TriageScreenState extends ConsumerState<TriageScreen> {
  final _complaint = TextEditingController();
  bool? _conscious;
  bool? _breathing;
  bool? _bleeding;
  int _step = 0;
  bool _busy = false;
  String? _error;

  static const _steps = 4;

  @override
  void dispose() {
    _complaint.dispose();
    super.dispose();
  }

  bool get _canAdvance {
    switch (_step) {
      case 0:
        return _complaint.text.trim().isNotEmpty;
      case 1:
        return _conscious != null;
      case 2:
        return _breathing != null;
      case 3:
        return _bleeding != null;
      default:
        return false;
    }
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final input = TriageInput(
      chiefComplaint: _complaint.text.trim(),
      isConscious: _conscious,
      isBreathing: _breathing,
      hasBleeding: _bleeding,
    );
    try {
      final loc = await ref.read(locationServiceProvider).current();
      final incident = await ref.read(emergencyRepositoryProvider).raiseSos(
            input,
            latitude: loc.latitude,
            longitude: loc.longitude,
          );
      final report = TriageResult.fromJson(
          incident['triageReport'] as Map<String, dynamic>);
      if (mounted) {
        context.pushReplacement('/report', extra: {
          'result': report,
          'incidentId': incident['id'],
        });
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not reach the assistant. Check your connection.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency assessment'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(value: (_step + 1) / _steps),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: SingleChildScrollView(child: _buildStep())),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(_error!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              Row(
                children: [
                  if (_step > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _busy ? null : () => setState(() => _step--),
                        child: const Text('Back'),
                      ),
                    ),
                  if (_step > 0) const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: (!_canAdvance || _busy)
                          ? null
                          : () {
                              if (_step < _steps - 1) {
                                setState(() => _step++);
                              } else {
                                _submit();
                              }
                            },
                      child: _busy
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(_step < _steps - 1 ? 'Next' : 'Get guidance'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _QuestionBlock(
          title: 'What happened?',
          child: TextField(
            controller: _complaint,
            maxLines: 4,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'e.g. My father is clutching his chest and sweating',
            ),
          ),
        );
      case 1:
        return _YesNo(
          title: 'Is the person conscious?',
          value: _conscious,
          onChanged: (v) => setState(() => _conscious = v),
        );
      case 2:
        return _YesNo(
          title: 'Are they breathing normally?',
          value: _breathing,
          onChanged: (v) => setState(() => _breathing = v),
        );
      case 3:
        return _YesNo(
          title: 'Is there heavy bleeding?',
          value: _bleeding,
          onChanged: (v) => setState(() => _bleeding = v),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _QuestionBlock extends StatelessWidget {
  final String title;
  final Widget child;
  const _QuestionBlock({required this.title, required this.child});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 20),
        child,
      ],
    );
  }
}

class _YesNo extends StatelessWidget {
  final String title;
  final bool? value;
  final ValueChanged<bool> onChanged;
  const _YesNo({required this.title, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return _QuestionBlock(
      title: title,
      child: Column(
        children: [
          _choice(context, 'Yes', true),
          const SizedBox(height: 12),
          _choice(context, 'No', false),
        ],
      ),
    );
  }

  Widget _choice(BuildContext context, String label, bool v) {
    final selected = value == v;
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => onChanged(v),
      child: Container(
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: selected ? scheme.primary : scheme.outlineVariant,
              width: selected ? 2 : 1),
          color: selected ? scheme.primaryContainer : null,
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 18,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
      ),
    );
  }
}
