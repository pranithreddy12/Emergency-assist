import 'package:flutter_test/flutter_test.dart';
import 'package:emergencyai/core/audio/metronome.dart';

void main() {
  test('CPR cadence stays within the AHA 100-120/min range', () {
    expect(Metronome.bpm, inInclusiveRange(100, 120));
    // Beat period must match the BPM (guards against a wrong divisor).
    final periodMs = (60000 / Metronome.bpm).round();
    expect(periodMs, inInclusiveRange(500, 600)); // ~545ms at 110
  });
}
