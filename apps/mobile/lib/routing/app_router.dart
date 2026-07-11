import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/application/auth_controller.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/emergency/presentation/dashboard_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/triage/domain/triage_models.dart';
import '../features/triage/presentation/report_screen.dart';
import '../features/triage/presentation/triage_screen.dart';
import '../features/guidance/presentation/guidance_list_screen.dart';
import '../features/guidance/presentation/guidance_detail_screen.dart';
import '../features/hospitals/presentation/hospital_search_screen.dart';
import '../features/ambulance/presentation/ambulance_screen.dart';

/// GoRouter with an auth-aware redirect driven by [authControllerProvider].
final routerProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterRefresh(ref);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loggingIn = state.matchedLocation == '/login';
      switch (auth) {
        case AuthUnknown():
          return null; // splash-through; screens guard themselves
        case AuthUnauthenticated():
          return loggingIn ? null : '/login';
        case AuthAuthenticated():
          return loggingIn ? '/' : null;
      }
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/', builder: (_, __) => const DashboardScreen()),
      GoRoute(path: '/triage', builder: (_, __) => const TriageScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/guidance', builder: (_, __) => const GuidanceListScreen()),
      GoRoute(
        path: '/guidance/:slug',
        builder: (_, state) => GuidanceDetailScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(path: '/hospitals', builder: (_, __) => const HospitalSearchScreen()),
      GoRoute(path: '/ambulance', builder: (_, __) => const AmbulanceScreen()),
      GoRoute(
        path: '/report',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ReportScreen(
            result: extra?['result'] as TriageResult,
            incidentId: extra?['incidentId'] as String?,
          );
        },
      ),
    ],
  );
});

/// Bridges Riverpod state changes to GoRouter's Listenable refresh.
class _RouterRefresh extends ChangeNotifier {
  _RouterRefresh(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}
