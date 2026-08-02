import 'package:flutter_test/flutter_test.dart';
import 'package:emergencyai/features/rescue/domain/protocol.dart';

void main() {
  group('infant protocols (routing + safety-critical content)', () {
    test('byId resolves the infant variants the assess flow routes to', () {
      // The infant flow navigates to /coach/infant-cpr and /coach/infant-choking;
      // both must resolve (not silently fall back to adult CPR).
      expect(Protocols.byId('infant-cpr').id, 'infant-cpr');
      expect(Protocols.byId('infant-choking').id, 'infant-choking');
    });

    test('infant CPR drives the metronome coach with infant technique', () {
      final p = Protocols.infantCpr;
      expect(p.kind, RescueKind.cpr); // metronome, not step cards
      expect(p.cprSubtitle.toLowerCase(), contains('finger')); // 2 fingers, not palm
      expect(p.intro.toLowerCase(), contains('two fingers'));
    });

    test('infant choking uses back blows + chest thrusts and NO abdominal-thrust action', () {
      final p = Protocols.infantChoking;
      expect(p.kind, RescueKind.steps);

      // Safety-critical: no coached STEP may instruct abdominal thrusts (Heimlich)
      // on a baby — unlike the adult choking protocol, which does.
      bool titlesMention(RescueProtocol pr, String kw) =>
          pr.steps.any((s) => s.title.toLowerCase().contains(kw));
      expect(titlesMention(p, 'abdominal'), isFalse);
      expect(titlesMention(Protocols.choking, 'abdominal'), isTrue); // adult contrast

      final actions = p.steps.map((s) => '${s.title} ${s.voice}').join(' ').toLowerCase();
      expect(actions, contains('back blow'));
      expect(actions, contains('chest thrust'));
    });
  });
}
