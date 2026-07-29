import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/rescue_theme.dart';
import '../../../core/voice/tts_service.dart';
import 'widgets/call_help_bar.dart';

/// Choreographed triage. Two huge choices at a time, spoken aloud, routing the
/// bystander to the right coach in as few taps as possible.
class AssessScreen extends ConsumerStatefulWidget {
  const AssessScreen({super.key});
  @override
  ConsumerState<AssessScreen> createState() => _AssessScreenState();
}

enum _Q { awake, breathing, whatHappened }

class _AssessScreenState extends ConsumerState<AssessScreen> {
  _Q _q = _Q.awake;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _speak());
  }

  void _speak() {
    final tts = ref.read(ttsProvider);
    switch (_q) {
      case _Q.awake:
        tts.say('Are they awake and responding to you?');
      case _Q.breathing:
        tts.say('Are they breathing normally?');
      case _Q.whatHappened:
        tts.say('What is happening?');
    }
  }

  void _go(_Q q) {
    setState(() => _q = q);
    _speak();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(leading: BackButton(onPressed: () => context.pop())),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: switch (_q) {
            _Q.awake => _yesNo(
                context,
                'Are they awake?',
                'Tap their shoulders and shout. Any response — eyes, movement, sound?',
                onYes: () => _go(_Q.whatHappened),
                onNo: () => _go(_Q.breathing),
              ),
            _Q.breathing => _yesNo(
                context,
                'Are they breathing normally?',
                'Look for the chest rising. Gasping or nothing does NOT count as breathing.',
                yesLabel: 'Yes, breathing',
                noLabel: 'No / not sure',
                onYes: () => context.push('/coach/recovery'),
                onNo: () => context.push('/coach/cpr'),
                critical: true,
              ),
            _Q.whatHappened => _whatHappened(context),
          },
        ),
      ),
      bottomNavigationBar: const CallHelpBar(),
    );
  }

  Widget _yesNo(
    BuildContext context,
    String question,
    String detail, {
    String yesLabel = 'Yes',
    String noLabel = 'No',
    required VoidCallback onYes,
    required VoidCallback onNo,
    bool critical = false,
  }) {
    return Column(
      children: [
        const SizedBox(height: 8),
        Text(question, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 10),
        Text(detail, style: const TextStyle(color: Rescue.muted, fontSize: 16, height: 1.4)),
        const Spacer(),
        _bigChoice(noLabel, critical ? Rescue.critical : Rescue.surfaceHi,
            critical ? Colors.white : Rescue.text, onNo,
            icon: critical ? Icons.warning_amber_rounded : null),
        const SizedBox(height: 16),
        _bigChoice(yesLabel, Rescue.surfaceHi, Rescue.text, onYes),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _whatHappened(BuildContext context) {
    final items = [
      (Icons.air, 'Choking', "Can't breathe, cough or speak", () => context.push('/coach/choking')),
      (Icons.bloodtype, 'Severe bleeding', 'Heavy or spurting blood', () => context.push('/coach/bleeding')),
      (Icons.psychology, 'Something else', 'Describe it — get AI guidance', () => context.push('/triage')),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text('What’s happening?', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        ...items.map((it) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _tile(it.$1, it.$2, it.$3, it.$4),
            )),
      ],
    );
  }

  Widget _bigChoice(String label, Color bg, Color fg, VoidCallback onTap, {IconData? icon}) {
    return SizedBox(
      height: 88,
      width: double.infinity,
      child: FilledButton(
        onPressed: onTap,
        style: FilledButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[Icon(icon, size: 28), const SizedBox(width: 10)],
            Text(label, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }

  Widget _tile(IconData icon, String title, String sub, VoidCallback onTap) {
    return Material(
      color: Rescue.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                    color: Rescue.surfaceHi, borderRadius: BorderRadius.circular(14)),
                child: Icon(icon, color: Rescue.calm, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(sub, style: const TextStyle(color: Rescue.muted, fontSize: 14)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Rescue.muted),
            ],
          ),
        ),
      ),
    );
  }
}
