import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';
import '../../triage/domain/triage_models.dart';

class EmergencyRepository {
  final ApiClient _api;
  EmergencyRepository(this._api);

  /// Stateless triage assessment (used by the guided conversation preview).
  Future<TriageResult> assess(TriageInput input) async {
    final res = await _api.post('/triage/assess', input.toJson());
    return TriageResult.fromJson(res as Map<String, dynamic>);
  }

  /// Raises an SOS: creates an incident that runs triage server-side and
  /// persists an immutable report. Returns the incident id + result.
  Future<Map<String, dynamic>> raiseSos(
    TriageInput input, {
    double? latitude,
    double? longitude,
    String? address,
  }) async {
    final res = await _api.post('/incidents', {
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (address != null) 'address': address,
      'triage': input.toJson(),
    });
    return res as Map<String, dynamic>;
  }

  Future<List<dynamic>> listIncidents() async {
    final res = await _api.get('/incidents');
    return res as List<dynamic>;
  }

  /// Alerts the user's emergency contacts and returns a public tracking link.
  Future<Map<String, dynamic>> alertContacts(String incidentId) async {
    final res = await _api.post('/incidents/$incidentId/alert-contacts');
    return res as Map<String, dynamic>;
  }

  /// Sends a pre-arrival clinical hand-off to a hospital.
  Future<Map<String, dynamic>> sendPrearrival(String incidentId, String hospitalId) async {
    final res = await _api.post('/incidents/$incidentId/prearrival', {'hospitalId': hospitalId});
    return res as Map<String, dynamic>;
  }
}

final emergencyRepositoryProvider = Provider<EmergencyRepository>((ref) {
  return EmergencyRepository(ref.watch(apiClientProvider));
});
