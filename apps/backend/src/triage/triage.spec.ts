import { Severity } from '@prisma/client';
import { MockTriageProvider } from './providers/mock-triage.provider';
import { scrubActions, containsUnsafeMedicalClaim } from './triage.guardrails';

describe('MockTriageProvider', () => {
  const provider = new MockTriageProvider();

  it('classifies a not-breathing patient as CRITICAL', async () => {
    const r = await provider.assess({
      chiefComplaint: 'collapsed',
      isBreathing: false,
      isConscious: false,
    });
    expect(r.severity).toBe(Severity.CRITICAL);
    expect(r.recommendedActions.join(' ')).toMatch(/CPR|emergency/i);
  });

  it('routes chest pain to a cardiac facility as CRITICAL', async () => {
    const r = await provider.assess({ chiefComplaint: 'severe chest pain and sweating' });
    expect(r.severity).toBe(Severity.CRITICAL);
    expect(r.suggestedFacility).toBe('CARDIAC');
  });

  it('escalates life-threatening free-text phrases to CRITICAL (voice assist path)', async () => {
    for (const phrase of [
      'my father collapsed and is not breathing',
      'she is unconscious and unresponsive',
      'he stopped breathing',
    ]) {
      const r = await provider.assess({ chiefComplaint: phrase, freeText: phrase });
      expect(r.severity).toBe(Severity.CRITICAL);
      expect(r.recommendedActions.join(' ')).toMatch(/CPR|emergency/i);
    }
  });

  it('flags severe bleeding as at least HIGH', async () => {
    const r = await provider.assess({ chiefComplaint: 'deep cut', hasBleeding: true });
    expect([Severity.HIGH, Severity.CRITICAL]).toContain(r.severity);
  });

  it('gives low-severity generic guidance when there is little signal', async () => {
    const r = await provider.assess({ chiefComplaint: 'feeling a bit off' });
    expect(r.severity).toBe(Severity.LOW);
    expect(r.recommendedActions.length).toBeGreaterThan(0);
  });

  it('returns a confidence between 0 and 1 and always includes the disclaimer', async () => {
    const r = await provider.assess({ chiefComplaint: 'burn on hand' });
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(r.disclaimer).toMatch(/not a medical diagnosis/i);
  });

  it('never emits prescription or diagnosis language in actions', async () => {
    const complaints = ['chest pain', 'snake bite', 'poison', 'seizure', 'choking'];
    for (const c of complaints) {
      const r = await provider.assess({ chiefComplaint: c });
      for (const action of r.recommendedActions) {
        expect(containsUnsafeMedicalClaim(action)).toBe(false);
      }
    }
  });
});

describe('guardrails', () => {
  it('scrubs prescription/dosing lines', () => {
    const { actions, report } = scrubActions([
      'Apply firm pressure to the wound.',
      'Take 500mg of ibuprofen now.',
      'You have a heart attack.',
    ]);
    expect(actions).toEqual(['Apply firm pressure to the wound.']);
    expect(report.safe).toBe(false);
    expect(report.removed.length).toBe(2);
  });
});
