import { Severity } from '@prisma/client';

/** Structured input gathered from the AI conversation / SOS form. */
export interface TriageInput {
  chiefComplaint: string;
  isConscious?: boolean;
  isBreathing?: boolean;
  hasBleeding?: boolean;
  patientAge?: number;
  symptoms?: string[];
  freeText?: string; // anything the user typed/said
}

/** Structured output. This is guidance, NEVER a diagnosis or prescription. */
export interface TriageResult {
  severity: Severity;
  confidence: number; // 0..1
  chiefComplaint: string;
  isConscious?: boolean;
  isBreathing?: boolean;
  hasBleeding?: boolean;
  patientAge?: number;
  symptoms: string[];
  recommendedActions: string[]; // first-aid steps
  suggestedFacility?: string; // TRAUMA_CENTER | CARDIAC | STROKE | BURN | PEDIATRIC | GENERAL
  disclaimer: string;
  engineVersion: string;
  provider: 'mock' | 'openai';
  rawModel?: unknown;
}

export const TRIAGE_DISCLAIMER =
  'This is first-aid guidance only, not a medical diagnosis or prescription. ' +
  'Call your local emergency number immediately for any serious situation.';

export const TRIAGE_PROVIDER = Symbol('TRIAGE_PROVIDER');

export interface TriageProvider {
  readonly name: 'mock' | 'openai';
  assess(input: TriageInput): Promise<TriageResult>;
}
