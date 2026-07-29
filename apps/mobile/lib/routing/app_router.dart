import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/rescue/presentation/home_screen.dart';
import '../features/rescue/presentation/assess_screen.dart';
import '../features/rescue/presentation/cpr_coach_screen.dart';
import '../features/rescue/presentation/step_coach_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/triage/domain/triage_models.dart';
import '../features/triage/presentation/report_screen.dart';
import '../features/triage/presentation/triage_screen.dart';
import '../features/guidance/presentation/guidance_list_screen.dart';
import '../features/guidance/presentation/guidance_detail_screen.dart';
import '../features/hospitals/presentation/hospital_search_screen.dart';
import '../features/ambulance/presentation/ambulance_screen.dart';

/// Bystander-first: no auth gate. The rescue flow is instantly reachable; a
/// guest session is created silently in the background (see app.dart) so the
/// secondary screens (profile/hospitals) work too.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/assess', builder: (_, __) => const AssessScreen()),

      // Coaches
      GoRoute(path: '/coach/cpr', builder: (_, __) => const CprCoachScreen()),
      GoRoute(
        path: '/coach/:id',
        builder: (_, state) => StepCoachScreen(protocolId: state.pathParameters['id']!),
      ),

      // Secondary
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/triage', builder: (_, __) => const TriageScreen()),
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
