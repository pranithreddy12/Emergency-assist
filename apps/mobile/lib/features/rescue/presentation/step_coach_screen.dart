import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../../core/theme/rescue_theme.dart';
import '../../../core/voice/tts_service.dart';
import '../data/rescue_service.dart';
import '../domain/protocol.dart';
import 'widgets/call_help_bar.dart';

/// Big, voiced, one-step-at-a-time coaching for choking / bleeding / recovery.
class StepCoachScreen extends ConsumerStatefulWidget {
  final String protocolId;
  const StepCoachScreen({super.key, required this.protocolId});
  @override
  ConsumerState<StepCoachScreen> createState() => _StepCoachScreenState();
}

class _StepCoachScreenState extends ConsumerState<StepCoachScreen> {
  late final RescueProtocol _p = Protocols.byId(widget.protocolId);
  int _i = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _begin());
  }

  Future<void> _begin() async {
    WakelockPlus.enable();
    final tts = ref.read(ttsProvider);
    await tts.say(_p.intro);
    tts.cue(_p.steps.first.voice);
    ref.read(rescueServiceProvider).raise(_p); // background SOS
  }

  void _next() {
    if (_i < _p.steps.length - 1) {
      setState(() => _i++);
      ref.read(ttsProvider).say(_p.steps[_i].voice);
    } else {
      context.go('/'); // finished — return to calm home
    }
  }

  @override
  void dispose() {
    WakelockPlus.disable();
    ref.read(ttsProvider).stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final step = _p.steps[_i];
    final isLast = _i == _p.steps.length - 1;
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.pop()),
        title: Text(_p.title, style: const TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Text('Step ${_i + 1} of ${_p.steps.length}',
                  style: const TextStyle(color: Rescue.muted, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 132,
                height: 132,
                decoration: const BoxDecoration(color: Rescue.surfaceHi, shape: BoxShape.circle),
                child: Icon(step.icon, size: 64, color: Rescue.calm),
              ),
              const SizedBox(height: 32),
              Text(step.title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, height: 1.15)),
              const SizedBox(height: 16),
              Text(step.detail,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Rescue.muted, fontSize: 17, height: 1.5)),
              const Spacer(),

              // Progress dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_p.steps.length, (k) {
                  final active = k <= _i;
                  return Container(
                    width: active ? 26 : 10,
                    height: 10,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: active ? Rescue.calm : Rescue.line,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 72,
                width: double.infinity,
                child: FilledButton(
                  onPressed: _next,
                  style: FilledButton.styleFrom(
                    backgroundColor: isLast ? Rescue.go : Rescue.calm,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  ),
                  child: Text(isLast ? 'Done — keep them safe' : 'Next step',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                ),
              ),
              // Repeat spoken instruction on demand.
              TextButton.icon(
                onPressed: () => ref.read(ttsProvider).say(step.voice),
                icon: const Icon(Icons.volume_up, color: Rescue.muted, size: 18),
                label: const Text('Say it again', style: TextStyle(color: Rescue.muted)),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const CallHelpBar(),
    );
  }
}
