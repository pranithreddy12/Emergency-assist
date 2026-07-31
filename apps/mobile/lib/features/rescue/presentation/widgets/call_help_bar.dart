import 'dart:ui' show PlatformDispatcher;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/location/location_service.dart';
import '../../../../core/theme/rescue_theme.dart';

// Medical/all-services number for countries whose number differs from 112.
// 112 is the GSM-universal fallback (EU + most of the world), so the default
// below is safe when a country isn't listed; where a distinct ambulance number
// exists (e.g. JP 119, BR 192) we use it. Verified high-confidence values only.
const _byCountry = <String, String>{
  'US': '911', 'CA': '911', 'MX': '911',
  'GB': '999', 'IE': '999',
  'AU': '000', 'NZ': '111',
  'IN': '112', 'JP': '119', 'KR': '119', 'CN': '120', 'TW': '119',
  'HK': '999', 'SG': '995', 'MY': '999', 'PH': '911',
  'IL': '101', 'AE': '999', 'SA': '997',
  'BR': '192', 'AR': '107', 'ZA': '112',
};

const _override = String.fromEnvironment('EMERGENCY_NUMBER');

/// Pure country→number lookup (exposed for testing). Unknown/absent → 112.
String numberForCountry(String? cc) => _byCountry[cc?.toUpperCase()] ?? '112';

/// The emergency number to dial: an explicit build override wins; otherwise it's
/// picked from the device's country; otherwise 112 (works almost everywhere).
String get emergencyNumber => _override.isNotEmpty
    ? _override
    : numberForCountry(PlatformDispatcher.instance.locale.countryCode);

Future<void> callEmergency() async {
  final uri = Uri(scheme: 'tel', path: emergencyNumber);
  try {
    await launchUrl(uri);
  } catch (_) {/* on unsupported platforms this is a no-op */}
}

/// Persistent footer on every rescue screen: the exact location to read to the
/// dispatcher (the #1 cause of dispatch delay is "I don't know where I am"),
/// plus a one-tap emergency call.
class CallHelpBar extends ConsumerWidget {
  const CallHelpBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = ref.watch(currentLocationProvider);
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            loc.maybeWhen(
              data: (l) => _LocationLine(l),
              orElse: () => const SizedBox.shrink(),
            ),
            SizedBox(
              height: 60,
              child: FilledButton.icon(
                onPressed: callEmergency,
                style: FilledButton.styleFrom(
                  backgroundColor: Rescue.critical,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                icon: const Icon(Icons.call, size: 26),
                label: Text('Call $emergencyNumber',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LocationLine extends StatelessWidget {
  final LatLng l;
  const _LocationLine(this.l);

  @override
  Widget build(BuildContext context) {
    final coords = '${l.latitude.toStringAsFixed(5)}, ${l.longitude.toStringAsFixed(5)}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () {
          Clipboard.setData(ClipboardData(text: coords));
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Location copied — read it to the dispatcher')));
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Rescue.surfaceHi,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.location_on, color: Rescue.calm, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Read your location to the dispatcher',
                        style: TextStyle(color: Rescue.muted, fontSize: 11)),
                    Text(coords,
                        style: const TextStyle(color: Rescue.text, fontSize: 15, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              const Icon(Icons.copy, color: Rescue.muted, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
