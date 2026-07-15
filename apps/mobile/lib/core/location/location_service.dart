import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

class LatLng {
  final double latitude;
  final double longitude;
  const LatLng(this.latitude, this.longitude);
}

class LocationDenied implements Exception {
  final String message;
  LocationDenied(this.message);
  @override
  String toString() => message;
}

/// Wraps geolocator with permission handling and a graceful fallback location
/// so emergency flows never hard-fail when GPS is unavailable.
class LocationService {
  /// San Francisco fallback (matches the seeded demo dataset).
  static const LatLng fallback = LatLng(37.7749, -122.4194);

  Future<LatLng> current({bool allowFallback = true}) async {
    try {
      final serviceOn = await Geolocator.isLocationServiceEnabled();
      if (!serviceOn) {
        if (allowFallback) return fallback;
        throw LocationDenied('Location services are disabled.');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (allowFallback) return fallback;
        throw LocationDenied('Location permission denied.');
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      return LatLng(pos.latitude, pos.longitude);
    } catch (e) {
      if (allowFallback) return fallback;
      rethrow;
    }
  }

  /// Live position stream for ambulance/incident tracking.
  Stream<LatLng> watch() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).map((p) => LatLng(p.latitude, p.longitude));
  }
}

final locationServiceProvider = Provider<LocationService>((ref) => LocationService());

/// One-shot current location (with fallback), for screens that need coordinates.
final currentLocationProvider = FutureProvider.autoDispose<LatLng>((ref) {
  return ref.watch(locationServiceProvider).current();
});
