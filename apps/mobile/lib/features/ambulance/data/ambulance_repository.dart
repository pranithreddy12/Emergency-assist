import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers.dart';

class AmbulanceRepository {
  final ApiClient _api;
  AmbulanceRepository(this._api);

  Future<Map<String, dynamic>> book({
    required double pickupLat,
    required double pickupLng,
    String? pickupAddress,
    String? incidentId,
    String? destinationHospitalId,
    String? type,
  }) async {
    final res = await _api.post('/ambulance/book', {
      'pickupLat': pickupLat,
      'pickupLng': pickupLng,
      if (pickupAddress != null) 'pickupAddress': pickupAddress,
      if (incidentId != null) 'incidentId': incidentId,
      if (destinationHospitalId != null) 'destinationHospitalId': destinationHospitalId,
      if (type != null) 'type': type,
    });
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> track(String requestId) async {
    final res = await _api.get('/ambulance/requests/$requestId/track');
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cancel(String requestId) async {
    final res = await _api.delete('/ambulance/requests/$requestId');
    return res as Map<String, dynamic>;
  }
}

final ambulanceRepositoryProvider = Provider<AmbulanceRepository>((ref) {
  return AmbulanceRepository(ref.watch(apiClientProvider));
});
