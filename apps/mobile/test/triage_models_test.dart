import 'package:flutter_test/flutter_test.dart';
import 'package:emergencyai/features/triage/domain/triage_models.dart';

void main() {
  group('TriageInput', () {
    test('serializes only provided fields', () {
      const input = TriageInput(chiefComplaint: 'chest pain', isBreathing: false);
      final json = input.toJson();
      expect(json['chiefComplaint'], 'chest pain');
      expect(json['isBreathing'], false);
      expect(json.containsKey('isConscious'), false);
      expect(json.containsKey('symptoms'), false);
    });
  });

  group('TriageResult', () {
    test('parses a backend triage payload', () {
      final r = TriageResult.fromJson({
        'severity': 'CRITICAL',
        'confidence': 0.88,
        'chiefComplaint': 'chest pain',
        'recommendedActions': ['Call emergency services now.'],
        'suggestedFacility': 'CARDIAC',
        'disclaimer': 'Not a diagnosis.',
        'provider': 'mock',
      });
      expect(r.severity, 'CRITICAL');
      expect(r.confidence, 0.88);
      expect(r.recommendedActions.first, contains('emergency'));
      expect(r.suggestedFacility, 'CARDIAC');
    });

    test('tolerates missing optional fields', () {
      final r = TriageResult.fromJson({'severity': 'LOW', 'confidence': 0.5});
      expect(r.recommendedActions, isEmpty);
      expect(r.suggestedFacility, isNull);
    });
  });
}
