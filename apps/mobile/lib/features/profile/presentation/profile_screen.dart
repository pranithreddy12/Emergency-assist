import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/config/env.dart';
import '../data/profile_repository.dart';

const _bloodGroups = [
  'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'UNKNOWN'
];

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(profileProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Medical profile')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load profile.\n$e', textAlign: TextAlign.center)),
        data: (p) => _ProfileBody(profile: p),
      ),
    );
  }
}

class _ProfileBody extends ConsumerStatefulWidget {
  final Map<String, dynamic> profile;
  const _ProfileBody({required this.profile});
  @override
  ConsumerState<_ProfileBody> createState() => _ProfileBodyState();
}

class _ProfileBodyState extends ConsumerState<_ProfileBody> {
  late String _bloodGroup;
  late TextEditingController _allergies;
  late TextEditingController _medications;
  late bool _organDonor;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _bloodGroup = (p['bloodGroup'] as String?) ?? 'UNKNOWN';
    _allergies = TextEditingController(text: (p['allergies'] as List? ?? []).join(', '));
    _medications = TextEditingController(text: (p['medications'] as List? ?? []).join(', '));
    _organDonor = (p['isOrganDonor'] as bool?) ?? false;
  }

  @override
  void dispose() {
    _allergies.dispose();
    _medications.dispose();
    super.dispose();
  }

  List<String> _split(String s) =>
      s.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(profileRepositoryProvider).update({
        'bloodGroup': _bloodGroup,
        'allergies': _split(_allergies.text),
        'medications': _split(_medications.text),
        'isOrganDonor': _organDonor,
      });
      ref.invalidate(profileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Profile saved')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Save failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final qrToken = widget.profile['qrToken'] as String?;
    final cardUrl = qrToken == null ? null : '${Env.apiBaseUrl}/medical-card/$qrToken';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (cardUrl != null)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text('Emergency QR card',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  QrImageView(
                    data: cardUrl,
                    size: 180,
                    backgroundColor: Colors.white,
                  ),
                  const SizedBox(height: 8),
                  const Text('Responders can scan this for your blood group, allergies & meds.',
                      textAlign: TextAlign.center, style: TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _bloodGroup,
          decoration: const InputDecoration(labelText: 'Blood group'),
          items: _bloodGroups
              .map((b) => DropdownMenuItem(value: b, child: Text(b.replaceAll('_', ' '))))
              .toList(),
          onChanged: (v) => setState(() => _bloodGroup = v ?? 'UNKNOWN'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _allergies,
          decoration: const InputDecoration(
              labelText: 'Allergies', hintText: 'Comma-separated'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _medications,
          decoration: const InputDecoration(
              labelText: 'Current medications', hintText: 'Comma-separated'),
        ),
        const SizedBox(height: 4),
        SwitchListTile(
          title: const Text('Registered organ donor'),
          value: _organDonor,
          onChanged: (v) => setState(() => _organDonor = v),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Save profile'),
        ),
      ],
    );
  }
}
