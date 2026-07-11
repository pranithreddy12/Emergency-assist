import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Severity } from '@prisma/client';
import {
  TriageInput,
  TriageProvider,
  TriageResult,
  TRIAGE_DISCLAIMER,
} from '../triage.types';
import { scrubActions } from '../triage.guardrails';
import { MockTriageProvider } from './mock-triage.provider';

const ENGINE_VERSION = 'openai-1.0.0';

const SYSTEM_PROMPT = `You are an emergency first-aid triage assistant.
STRICT RULES:
- You MUST NOT diagnose any medical condition.
- You MUST NOT prescribe or recommend any specific medication or dose.
- Provide only evidence-based first-aid steps (AHA / Red Cross / WHO).
- Always advise contacting local emergency services for serious situations.
Return ONLY JSON matching the requested schema.`;

/**
 * Real OpenAI-backed triage. Uses structured JSON output, then runs the same
 * guardrail scrubbing as the mock. Any failure falls back to the deterministic
 * mock so the app never loses triage capability.
 */
@Injectable()
export class OpenAiTriageProvider implements TriageProvider {
  readonly name = 'openai' as const;
  private readonly logger = new Logger(OpenAiTriageProvider.name);
  private readonly client?: OpenAI;
  private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  constructor(private readonly fallback: MockTriageProvider) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) this.client = new OpenAI({ apiKey });
    else this.logger.warn('OPENAI_API_KEY missing; OpenAI provider will fall back to mock.');
  }

  async assess(input: TriageInput): Promise<TriageResult> {
    if (!this.client) return this.fallback.assess(input);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              instruction:
                'Classify severity (LOW|MEDIUM|HIGH|CRITICAL), give confidence 0..1, list ' +
                'first-aid recommendedActions (no meds, no diagnosis), suggest a facility type, ' +
                'and echo symptoms. JSON keys: severity, confidence, recommendedActions[], ' +
                'suggestedFacility, symptoms[].',
              input,
            }),
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as Partial<TriageResult> & { severity?: string };

      const severity = this.coerceSeverity(parsed.severity);
      const { actions } = scrubActions(parsed.recommendedActions ?? []);

      return {
        severity,
        confidence: this.clamp(parsed.confidence ?? 0.6),
        chiefComplaint: input.chiefComplaint,
        isConscious: input.isConscious,
        isBreathing: input.isBreathing,
        hasBleeding: input.hasBleeding,
        patientAge: input.patientAge,
        symptoms: parsed.symptoms ?? input.symptoms ?? [],
        recommendedActions:
          actions.length > 0
            ? actions
            : ['Keep the person calm and call local emergency services if the situation is serious.'],
        suggestedFacility: parsed.suggestedFacility,
        disclaimer: TRIAGE_DISCLAIMER,
        engineVersion: ENGINE_VERSION,
        provider: this.name,
        rawModel: parsed,
      };
    } catch (err) {
      this.logger.error('OpenAI triage failed; falling back to mock', err as Error);
      return this.fallback.assess(input);
    }
  }

  private coerceSeverity(value?: string): Severity {
    const v = (value ?? '').toUpperCase();
    if (v in Severity) return Severity[v as keyof typeof Severity];
    return Severity.MEDIUM;
  }

  private clamp(n: number): number {
    return Math.max(0, Math.min(1, n));
  }
}
