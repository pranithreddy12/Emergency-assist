/// Structured triage input gathered from the guided conversation.
class TriageInput {
  final String chiefComplaint;
  final bool? isConscious;
  final bool? isBreathing;
  final bool? hasBleeding;
  final int? patientAge;
  final List<String> symptoms;
  final String? freeText;

  const TriageInput({
    required this.chiefComplaint,
    this.isConscious,
    this.isBreathing,
    this.hasBleeding,
    this.patientAge,
    this.symptoms = const [],
    this.freeText,
  });

  Map<String, dynamic> toJson() => {
        'chiefComplaint': chiefComplaint,
        if (isConscious != null) 'isConscious': isConscious,
        if (isBreathing != null) 'isBreathing': isBreathing,
        if (hasBleeding != null) 'hasBleeding': hasBleeding,
        if (patientAge != null) 'patientAge': patientAge,
        if (symptoms.isNotEmpty) 'symptoms': symptoms,
        if (freeText != null) 'freeText': freeText,
      };

  TriageInput copyWith({
    String? chiefComplaint,
    bool? isConscious,
    bool? isBreathing,
    bool? hasBleeding,
    int? patientAge,
    List<String>? symptoms,
    String? freeText,
  }) =>
      TriageInput(
        chiefComplaint: chiefComplaint ?? this.chiefComplaint,
        isConscious: isConscious ?? this.isConscious,
        isBreathing: isBreathing ?? this.isBreathing,
        hasBleeding: hasBleeding ?? this.hasBleeding,
        patientAge: patientAge ?? this.patientAge,
        symptoms: symptoms ?? this.symptoms,
        freeText: freeText ?? this.freeText,
      );
}

/// Structured triage result. Guidance only — never a diagnosis/prescription.
class TriageResult {
  final String severity;
  final double confidence;
  final String chiefComplaint;
  final List<String> recommendedActions;
  final String? suggestedFacility;
  final String disclaimer;
  final String provider;

  const TriageResult({
    required this.severity,
    required this.confidence,
    required this.chiefComplaint,
    required this.recommendedActions,
    required this.disclaimer,
    required this.provider,
    this.suggestedFacility,
  });

  factory TriageResult.fromJson(Map<String, dynamic> j) => TriageResult(
        severity: j['severity'] as String,
        confidence: (j['confidence'] as num).toDouble(),
        chiefComplaint: j['chiefComplaint'] as String? ?? '',
        recommendedActions:
            (j['recommendedActions'] as List? ?? []).map((e) => e.toString()).toList(),
        suggestedFacility: j['suggestedFacility'] as String?,
        disclaimer: j['disclaimer'] as String? ?? '',
        provider: j['provider'] as String? ?? 'mock',
      );
}
