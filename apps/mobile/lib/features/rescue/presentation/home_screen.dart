import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/rescue_theme.dart';
import 'widgets/call_help_bar.dart';

/// The whole app funnels to one action. No dashboard, no menus.
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _breathe =
      AnimationController(vsync: this, duration: const Duration(seconds: 3))..repeat(reverse: true);

  @override
  void dispose() {
    _breathe.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
              child: Row(
                children: [
                  const Icon(Icons.shield_moon, color: Rescue.calm, size: 22),
                  const SizedBox(width: 8),
                  const Text('EmergencyAI',
                      style: TextStyle(
                          color: Rescue.text, fontWeight: FontWeight.w700, fontSize: 16)),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: callEmergency,
                    icon: const Icon(Icons.call, size: 18, color: Rescue.critical),
                    label: const Text('Call $emergencyNumber',
                        style: TextStyle(color: Rescue.critical, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
            const Spacer(),

            // The one action.
            Text('Is someone in trouble?',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Rescue.text)),
            const SizedBox(height: 8),
            const Text('Tap once. I’ll coach you through it, out loud.',
                style: TextStyle(color: Rescue.muted, fontSize: 15)),
            const SizedBox(height: 40),

            GestureDetector(
              onTap: () => context.push('/assess'),
              child: AnimatedBuilder(
                animation: _breathe,
                builder: (context, _) {
                  final t = _breathe.value;
                  return Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const RadialGradient(
                        colors: [Color(0xFFFF5A50), Rescue.critical],
                        center: Alignment(-0.2, -0.3),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Rescue.critical.withValues(alpha: 0.25 + t * 0.25),
                          blurRadius: 50 + t * 40,
                          spreadRadius: 6 + t * 10,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.touch_app, color: Colors.white, size: 56),
                          SizedBox(height: 10),
                          Text('HELP',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 46,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 3)),
                          Text('someone now',
                              style: TextStyle(color: Colors.white70, fontSize: 15)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const Spacer(),

            // Quiet secondary actions.
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _Secondary(icon: Icons.qr_code_2, label: 'My medical card', onTap: () => context.push('/profile')),
                const SizedBox(width: 28),
                _Secondary(icon: Icons.menu_book_outlined, label: 'Learn first aid', onTap: () => context.push('/guidance')),
                const SizedBox(width: 28),
                _Secondary(icon: Icons.local_hospital_outlined, label: 'Hospitals', onTap: () => context.push('/hospitals')),
              ],
            ),
            const SizedBox(height: 18),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'Guidance only — not a diagnosis. Always call your local emergency number.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Rescue.muted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _Secondary extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _Secondary({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Rescue.muted, size: 24),
            const SizedBox(height: 6),
            SizedBox(
              width: 76,
              child: Text(label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Rescue.muted, fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}
