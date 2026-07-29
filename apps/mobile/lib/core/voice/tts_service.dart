import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tts/flutter_tts.dart';

/// Hands-free spoken coaching. On web this uses the browser SpeechSynthesis.
/// All calls are best-effort: if speech is unavailable the app stays fully
/// usable (the visuals carry the coaching on their own).
class TtsService {
  final FlutterTts _tts = FlutterTts();
  bool _ready = false;

  Future<void> _ensure() async {
    if (_ready) return;
    try {
      await _tts.setLanguage('en-US');
      await _tts.setSpeechRate(0.5); // calm, clear
      await _tts.setVolume(1.0);
      await _tts.setPitch(1.0);
      await _tts.awaitSpeakCompletion(true);
      _ready = true;
    } catch (e) {
      if (kDebugMode) debugPrint('TTS init failed: $e');
    }
  }

  /// Speak a line. Interrupts whatever is currently being said.
  Future<void> say(String text) async {
    await _ensure();
    try {
      await _tts.stop();
      await _tts.speak(text);
    } catch (_) {/* silent fallback */}
  }

  /// Speak without interrupting (queued cue).
  Future<void> cue(String text) async {
    await _ensure();
    try {
      await _tts.speak(text);
    } catch (_) {}
  }

  Future<void> stop() async {
    try {
      await _tts.stop();
    } catch (_) {}
  }
}

final ttsProvider = Provider<TtsService>((ref) {
  final tts = TtsService();
  ref.onDispose(tts.stop);
  return tts;
});
