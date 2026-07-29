import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:audioplayers/audioplayers.dart';

/// A CPR metronome. Drives the correct 110 beats/min compression cadence
/// (AHA range 100–120) with an audible click, a haptic tick, and a [beat]
/// signal the UI pulses to. Audio is generated in-memory (no bundled asset).
class Metronome {
  static const int bpm = 110;

  final _player = AudioPlayer();
  Timer? _timer;
  late final Uint8List _click = _buildClickWav();

  /// Toggles true on each beat so widgets can animate to it.
  final ValueNotifier<int> beat = ValueNotifier<int>(0);
  bool get isRunning => _timer != null;

  Future<void> start() async {
    if (_timer != null) return;
    try {
      await _player.setReleaseMode(ReleaseMode.stop);
    } catch (_) {}
    _tick(); // immediate first beat
    _timer = Timer.periodic(Duration(milliseconds: (60000 / bpm).round()), (_) => _tick());
  }

  void _tick() {
    beat.value++;
    HapticFeedback.lightImpact();
    // Fire-and-forget; a dropped click never blocks the beat.
    _player.play(BytesSource(_click), volume: 0.9).catchError((_) {});
  }

  Future<void> stop() async {
    _timer?.cancel();
    _timer = null;
    try {
      await _player.stop();
    } catch (_) {}
  }

  Future<void> dispose() async {
    await stop();
    beat.dispose();
    try {
      await _player.dispose();
    } catch (_) {}
  }

  /// A short percussive click as a 16-bit PCM WAV (≈45 ms, decaying 1 kHz tone).
  static Uint8List _buildClickWav() {
    const sampleRate = 44100;
    const durMs = 45;
    const samples = sampleRate * durMs ~/ 1000;
    final data = BytesBuilder();

    // --- WAV header ---
    void writeStr(String s) => data.add(s.codeUnits);
    void writeU32(int v) => data.add([v & 0xFF, (v >> 8) & 0xFF, (v >> 16) & 0xFF, (v >> 24) & 0xFF]);
    void writeU16(int v) => data.add([v & 0xFF, (v >> 8) & 0xFF]);

    const dataBytes = samples * 2;
    writeStr('RIFF');
    writeU32(36 + dataBytes);
    writeStr('WAVE');
    writeStr('fmt ');
    writeU32(16);
    writeU16(1); // PCM
    writeU16(1); // mono
    writeU32(sampleRate);
    writeU32(sampleRate * 2); // byte rate
    writeU16(2); // block align
    writeU16(16); // bits per sample
    writeStr('data');
    writeU32(dataBytes);

    // --- samples: 1 kHz tone with fast exponential decay ---
    for (var i = 0; i < samples; i++) {
      final t = i / sampleRate;
      final env = (1.0 - i / samples);
      final amp = env * env; // sharp decay
      final v = (32767 * 0.8 * amp * _sin(2 * 3.141592653589793 * 1000 * t)).round();
      final s = v.clamp(-32768, 32767);
      data.add([s & 0xFF, (s >> 8) & 0xFF]);
    }
    return data.toBytes();
  }

  // Local sine to avoid importing dart:math just for one call.
  static double _sin(double x) {
    // Reduce to [-pi, pi]
    const twoPi = 6.283185307179586;
    x = x % twoPi;
    if (x > 3.141592653589793) x -= twoPi;
    final x2 = x * x;
    // Taylor series (good enough for a click).
    return x * (1 - x2 / 6 * (1 - x2 / 20 * (1 - x2 / 42)));
  }
}
