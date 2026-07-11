import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/application/auth_controller.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});
  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final authState = ref.watch(authControllerProvider);
    final name = switch (authState) {
      AuthAuthenticated(:final user) => user.displayName ?? (user.isGuest ? 'Guest' : 'there'),
      _ => 'there',
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('EmergencyAI'),
        actions: [
          IconButton(
            tooltip: 'Medical profile',
            icon: const Icon(Icons.badge_outlined),
            onPressed: () => context.push('/profile'),
          ),
          IconButton(
            tooltip: 'Log out',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text('Hello, $name',
                    style: Theme.of(context).textTheme.titleLarge),
              ),
              const SizedBox(height: 4),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('Tap SOS to start a guided emergency assessment.'),
              ),
              const Spacer(),
              // Large, pulsing SOS button.
              GestureDetector(
                onTap: () => context.push('/triage'),
                child: AnimatedBuilder(
                  animation: _pulse,
                  builder: (context, child) {
                    final t = _pulse.value;
                    return Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [AppTheme.emergencyRed, const Color(0xFFB71C1C)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.emergencyRed.withOpacity(0.35 + t * 0.25),
                            blurRadius: 30 + t * 30,
                            spreadRadius: 4 + t * 12,
                          ),
                        ],
                      ),
                      child: child,
                    );
                  },
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.emergency, color: Colors.white, size: 64),
                        SizedBox(height: 8),
                        Text('SOS',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 40,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2)),
                      ],
                    ),
                  ),
                ),
              ),
              const Spacer(),
              Row(
                children: [
                  _QuickAction(
                    icon: Icons.menu_book_outlined,
                    label: 'First aid',
                    onTap: () => context.push('/guidance'),
                    scheme: scheme,
                  ),
                  const SizedBox(width: 12),
                  _QuickAction(
                    icon: Icons.local_hospital_outlined,
                    label: 'Hospitals',
                    onTap: () => context.push('/hospitals'),
                    scheme: scheme,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _QuickAction(
                    icon: Icons.local_shipping_outlined,
                    label: 'Ambulance',
                    onTap: () => context.push('/ambulance'),
                    scheme: scheme,
                  ),
                  const SizedBox(width: 12),
                  _QuickAction(
                    icon: Icons.qr_code_2,
                    label: 'Medical card',
                    onTap: () => context.push('/profile'),
                    scheme: scheme,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Not a diagnosis. In a real emergency, call your local emergency number.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final ColorScheme scheme;
  const _QuickAction(
      {required this.icon, required this.label, required this.onTap, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              children: [
                Icon(icon, color: scheme.primary, size: 30),
                const SizedBox(height: 8),
                Text(label),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
