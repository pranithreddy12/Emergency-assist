import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/location/location_service.dart';
import '../../../core/network/api_client.dart';
import '../data/ambulance_repository.dart';

class AmbulanceScreen extends ConsumerStatefulWidget {
  final String? incidentId;
  final String? destinationHospitalId;
  final String? destinationName;
  const AmbulanceScreen({
    super.key,
    this.incidentId,
    this.destinationHospitalId,
    this.destinationName,
  });

  @override
  ConsumerState<AmbulanceScreen> createState() => _AmbulanceScreenState();
}

class _AmbulanceScreenState extends ConsumerState<AmbulanceScreen> {
  Map<String, dynamic>? _request;
  bool _busy = false;
  String? _error;
  Timer? _poll;

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _book() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final loc = await ref.read(locationServiceProvider).current();
      final req = await ref.read(ambulanceRepositoryProvider).book(
            pickupLat: loc.latitude,
            pickupLng: loc.longitude,
            pickupAddress: 'Current location',
            incidentId: widget.incidentId,
            destinationHospitalId: widget.destinationHospitalId,
          );
      setState(() => _request = req);
      _startPolling(req['id'] as String);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Could not book an ambulance. Please try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _startPolling(String requestId) {
    _poll?.cancel();
    _poll = Timer.periodic(const Duration(seconds: 5), (_) async {
      try {
        final t = await ref.read(ambulanceRepositoryProvider).track(requestId);
        if (mounted) setState(() => _request = {..._request!, ...t});
        final status = t['status'];
        if (status == 'CANCELLED' || status == 'COMPLETED') _poll?.cancel();
      } catch (_) {/* keep last known state */}
    });
  }

  Future<void> _cancel() async {
    final id = _request?['id'] as String?;
    if (id == null) return;
    _poll?.cancel();
    try {
      await ref.read(ambulanceRepositoryProvider).cancel(id);
      if (mounted) setState(() => _request = {..._request!, 'status': 'CANCELLED'});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Cancel failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ambulance')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: _request == null ? _bookView() : _trackView(),
        ),
      ),
    );
  }

  Widget _bookView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.local_shipping, size: 88),
        const SizedBox(height: 16),
        Text(
          widget.destinationName != null
              ? 'Request an ambulance to\n${widget.destinationName}'
              : 'Request an ambulance to your location',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        const Text('The nearest available unit will be assigned automatically.',
            textAlign: TextAlign.center),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 24),
        FilledButton.icon(
          onPressed: _busy ? null : _book,
          icon: _busy
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.bolt),
          label: const Text('Book now'),
        ),
      ],
    );
  }

  Widget _trackView() {
    final r = _request!;
    final scheme = Theme.of(context).colorScheme;
    final status = r['status'] as String? ?? 'ASSIGNED';
    final cancelled = status == 'CANCELLED';
    final driver = r['driver'] as Map<String, dynamic>?;
    final etaSeconds = (r['etaSeconds'] as num?)?.toInt();
    final mins = etaSeconds != null ? (etaSeconds / 60).round() : null;

    return ListView(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Icon(cancelled ? Icons.cancel : Icons.local_shipping,
                    size: 56, color: cancelled ? scheme.error : scheme.primary),
                const SizedBox(height: 8),
                Text(status, style: Theme.of(context).textTheme.titleLarge),
                if (!cancelled && mins != null)
                  Text('ETA ~$mins min', style: TextStyle(color: scheme.onSurfaceVariant)),
              ],
            ),
          ),
        ),
        if (driver != null && !cancelled) ...[
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person),
                  title: Text(driver['name'] as String? ?? 'Driver'),
                  subtitle: Text('Vehicle ${driver['vehicleNumber'] ?? ''} · ${driver['type'] ?? ''}'),
                ),
                ListTile(
                  leading: const Icon(Icons.phone),
                  title: Text(driver['phone'] as String? ?? ''),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        if (!cancelled)
          OutlinedButton.icon(
            onPressed: _cancel,
            icon: const Icon(Icons.close),
            label: const Text('Cancel request'),
            style: OutlinedButton.styleFrom(
                foregroundColor: scheme.error, minimumSize: const Size.fromHeight(50)),
          ),
      ],
    );
  }
}
