import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/rescue_theme.dart';
import 'features/auth/application/auth_controller.dart';
import 'routing/app_router.dart';

class EmergencyAiApp extends ConsumerStatefulWidget {
  const EmergencyAiApp({super.key});
  @override
  ConsumerState<EmergencyAiApp> createState() => _EmergencyAiAppState();
}

class _EmergencyAiAppState extends ConsumerState<EmergencyAiApp> {
  @override
  void initState() {
    super.initState();
    // Silently ensure a session exists so profile/hospitals work — but never
    // block or gate the rescue flow behind a login screen.
    ref.listenManual(authControllerProvider, (prev, next) {
      if (next is AuthUnauthenticated) {
        ref.read(authControllerProvider.notifier).continueAsGuest();
      }
    }, fireImmediately: true);
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'EmergencyAI',
      debugShowCheckedModeBanner: false,
      theme: Rescue.theme(),
      darkTheme: Rescue.theme(),
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}
