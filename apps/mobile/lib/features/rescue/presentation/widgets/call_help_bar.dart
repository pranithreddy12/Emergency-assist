import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/location/location_service.dart';
import '../../../../core/theme/rescue_theme.dart';

/// The emergency number. Region-configurable via --dart-define; defaults to 112
/// (works across the EU and most GSM networks worldwide).
const emergencyNumber = String.fromEnvironment('EMERGENCY_NUMBER', defaultValue: '112');

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
                label: const Text('Call $emergencyNumber',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
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
