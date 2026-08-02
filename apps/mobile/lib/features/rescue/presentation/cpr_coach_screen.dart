import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../../core/audio/metronome.dart';
import '../../../core/theme/rescue_theme.dart';
import '../../../core/voice/tts_service.dart';
import '../data/rescue_service.dart';
import '../domain/protocol.dart';
import 'widgets/call_help_bar.dart';
import 'widgets/aed_hint.dart';

/// The hero. Full-screen, hands-free CPR coaching: a giant ring that pumps at
/// the correct 110 bpm cadence with an audible click and a spoken intro, a live
/// compression count, and an elapsed timer.
class CprCoachScreen extends ConsumerStatefulWidget {
  final String protocolId; // 'cpr' (adult) or 'infant-cpr'
  const CprCoachScreen({super.key, this.protocolId = 'cpr'});
  @override
  ConsumerState<CprCoachScreen> createState() => _CprCoachScreenState();
}

class _CprCoachScreenState extends ConsumerState<CprCoachScreen>
    with SingleTickerProviderStateMixin {
  late final RescueProtocol _p = Protocols.byId(widget.protocolId);
  final _metro = Metronome();
  late final AnimationController _pump =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 320));

  int _count = 0;
  Duration _elapsed = Duration.zero;
  Timer? _clock;
  bool _alerted = false;
  bool _sosFailed = false;

  @override
  void initState() {
    super.initState();
    _metro.beat.addListener(_onBeat);
    WidgetsBinding.instance.addPostFrameCallback((_) => _begin());
  }

  Future<void> _begin() async {
    WakelockPlus.enable(); // keep the screen on through the whole rescue
    final tts = ref.read(ttsProvider);
    tts.say(_p.intro);
    // Evidence-backed: getting an AED to the scene raises survival sharply.
    tts.cue('If anyone else is there, send them to find the nearest defibrillator, an A E D, right now.');
    await _metro.start();
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _elapsed += const Duration(seconds: 1));
      // AHA: swap compressors every 2 minutes to fight fatigue.
      final s = _elapsed.inSeconds;
      if (s > 0 && s % 120 == 0) {
        ref.read(ttsProvider).cue('Two minutes. If someone can take over compressions, switch now — be quick.');
      }
    });
    // Log the SOS in the background — coaching never waits on it.
    final id = await ref.read(rescueServiceProvider).raise(_p);
    if (mounted) setState(() => _alerted = id != null); // false when offline
    if (mounted && id == null) _sosFailed = true;
  }

  void _onBeat() {
    _pump.forward(from: 0);
    _count++;
    if (mounted) setState(() {});
    // Brief spoken encouragement, timed so it never overlaps the beat.
    if (_count == 10) ref.read(ttsProvider).cue('Good. Keep pushing to the beat.');
    if (_count > 0 && _count % 100 == 0) {
      ref.read(ttsProvider).cue('You are doing great. Do not stop.');
    }
  }

  @override
  void dispose() {
    WakelockPlus.disable();
    _clock?.cancel();
    _metro.beat.removeListener(_onBeat);
    _metro.dispose();
    _pump.dispose();
    ref.read(ttsProvider).stop();
    super.dispose();
  }

  String get _time {
    final m = _elapsed.inMinutes.toString().padLeft(2, '0');
    final s = (_elapsed.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Status strip
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Row(
                children: [
                  BackButton(onPressed: () => context.pop()),
                  const Spacer(),
                  if (_alerted)
                    const _Chip(icon: Icons.check_circle, color: Rescue.go, label: 'Help alerted')
                  else if (_sosFailed)
                    const _Chip(icon: Icons.wifi_off, color: Rescue.critical, label: 'Offline — call directly')
                  else
                    const _Chip(icon: Icons.sync, color: Rescue.warn, label: 'Alerting help…'),
                ],
              ),
            ),

            const SizedBox(height: 6),
            const Text('PUSH HARD & FAST',
                style: TextStyle(color: Rescue.text, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 1)),
            Text(_p.cprSubtitle,
                style: const TextStyle(color: Rescue.muted, fontSize: 14)),

            const SizedBox(height: 12),
            const AedHint(),

            const Spacer(),

            // The pumping ring.
            AnimatedBuilder(
              animation: _pump,
              builder: (context, _) {
                // dip to ~0.82 at mid-beat, return to 1.0 — reads as a compression
                final v = _pump.value;
                final scale = 1.0 - 0.18 * _bump(v);
                final glow = 0.5 - 0.35 * _bump(v);
                return Transform.scale(
                  scale: scale,
                  child: Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const RadialGradient(
                        colors: [Color(0xFFFF5E7E), Rescue.pulse],
                        center: Alignment(-0.2, -0.3),
                      ),
                      boxShadow: [
                        BoxShadow(color: Rescue.pulse.withValues(alpha: glow), blurRadius: 60, spreadRadius: 8),
                      ],
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.favorite, color: Colors.white, size: 44),
                          SizedBox(height: 6),
                          Text('PUSH',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 56,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2)),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),

            const Spacer(),

            // Stats
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _stat('$_count', 'compressions'),
                Container(width: 1, height: 40, color: Rescue.line, margin: const EdgeInsets.symmetric(horizontal: 28)),
                _stat(_time, 'elapsed'),
              ],
            ),
            const SizedBox(height: 20),

            // "They started breathing" — the good outcome.
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                height: 56,
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => context.pushReplacement('/coach/recovery'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Rescue.go,
                    side: const BorderSide(color: Rescue.go, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.air),
                  label: const Text('They started breathing',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            // AED arrived — coach its use (top survival lever).
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                height: 52,
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: () => context.push('/coach/aed'),
                  icon: const Icon(Icons.electric_bolt, color: Rescue.calm),
                  label: const Text('The AED is here — use it',
                      style: TextStyle(color: Rescue.calm, fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const CallHelpBar(),
    );
  }

  // 0→1→0 hump for the compression dip.
  double _bump(double v) => v < 0.5 ? v * 2 : (1 - v) * 2;

  Widget _stat(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Rescue.text, fontSize: 34, fontWeight: FontWeight.w900)),
        Text(label, style: const TextStyle(color: Rescue.muted, fontSize: 13)),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  const _Chip({required this.icon, required this.color, required this.label});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
