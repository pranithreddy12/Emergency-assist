/**
 * Safety guardrails. EmergencyAI must never diagnose a condition or prescribe/
 * recommend a specific medication or dose. These filters scrub any such content
 * that could slip through an LLM response, and provide a schema-level check.
 */

// Words that indicate a prescription/dosing instruction.
const PRESCRIPTION_PATTERNS: RegExp[] = [
  /\btake\s+\d+\s*(mg|ml|g|tablet|pill|capsule|dose)/i,
  /\b\d+\s*(mg|milligram|ml|microgram|mcg)\b/i,
  /\bprescrib/i,
  /\bdosage\b/i,
  /\byou (should|must) take\b.*\b(medication|drug|pill|tablet)/i,
];

// Phrases that assert a definitive diagnosis.
const DIAGNOSIS_PATTERNS: RegExp[] = [
  /\byou (have|are having|are suffering from)\b/i,
  /\bthis is (a|an)\b.*\b(heart attack|stroke|infection|cancer|fracture)\b/i,
  /\bdiagnos/i,
];

export interface GuardrailReport {
  safe: boolean;
  removed: string[];
}

/** Removes offending sentences from a list of action strings. */
export function scrubActions(actions: string[]): { actions: string[]; report: GuardrailReport } {
  const removed: string[] = [];
  const kept = actions.filter((line) => {
    const offends =
      PRESCRIPTION_PATTERNS.some((r) => r.test(line)) ||
      DIAGNOSIS_PATTERNS.some((r) => r.test(line));
    if (offends) removed.push(line);
    return !offends;
  });
  return { actions: kept, report: { safe: removed.length === 0, removed } };
}

/** True if the text contains prescription or diagnosis language. */
export function containsUnsafeMedicalClaim(text: string): boolean {
  return (
    PRESCRIPTION_PATTERNS.some((r) => r.test(text)) ||
    DIAGNOSIS_PATTERNS.some((r) => r.test(text))
  );
}
