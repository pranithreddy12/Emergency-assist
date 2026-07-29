import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/location/location_service.dart';
import '../../auth/data/auth_repository.dart';
import '../../emergency/data/emergency_repository.dart';
import '../../triage/domain/triage_models.dart';
import '../domain/protocol.dart';

/// Fires an SOS incident to the backend the moment a rescue begins — completely
/// in the background. Coaching never waits on the network; if anything fails the
/// bystander keeps getting guidance regardless.
class RescueService {
  final AuthRepository _auth;
  final EmergencyRepository _emergency;
  final LocationService _location;

  RescueService(this._auth, this._emergency, this._location);

  Future<String?> raise(RescueProtocol protocol, {String? note}) async {
    try {
      if (!await _auth.hasSession()) {
        await _auth.guest(); // zero-friction: no sign-in in an emergency
      }
      final loc = await _location.current();
      final incident = await _emergency.raiseSos(
        TriageInput(
          chiefComplaint: note ?? _complaintFor(protocol),
          isConscious: protocol.id == 'recovery' ? false : null,
          isBreathing: protocol.id == 'cpr' ? false : null,
        ),
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: 'Shared automatically at rescue start',
      );
      return incident['id'] as String?;
    } catch (e) {
      if (kDebugMode) debugPrint('background SOS failed (non-fatal): $e');
      return null;
    }
  }

  String _complaintFor(RescueProtocol p) {
    switch (p.id) {
      case 'cpr':
        return 'Unresponsive, not breathing — CPR in progress';
      case 'choking':
        return 'Choking — airway obstructed';
      case 'bleeding':
        return 'Severe bleeding';
      case 'recovery':
        return 'Unresponsive but breathing — recovery position';
      default:
        return p.title;
    }
  }
}

final rescueServiceProvider = Provider<RescueService>((ref) {
  return RescueService(
    ref.watch(authRepositoryProvider),
    ref.watch(emergencyRepositoryProvider),
    ref.watch(locationServiceProvider),
  );
});
