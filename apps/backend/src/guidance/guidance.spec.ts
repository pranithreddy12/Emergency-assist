import { GuidanceService } from './guidance.service';
import { GUIDANCE_TOPICS } from './guidance.data';
import { containsUnsafeMedicalClaim } from '../triage/triage.guardrails';

describe('GuidanceService', () => {
  const service = new GuidanceService();

  it('lists all 16 required first-aid topics', () => {
    const res = service.list();
    expect(res.topics.length).toBe(16);
  });

  it('filters by category', () => {
    const res = service.list('cardiac');
    expect(res.topics.every((t) => t.category === 'cardiac')).toBe(true);
    expect(res.topics.length).toBeGreaterThan(0);
  });

  it('returns a topic with ordered steps and sources', () => {
    const cpr = service.get('cpr');
    expect(cpr.steps[0].order).toBe(1);
    expect(cpr.steps.length).toBeGreaterThan(3);
    expect(cpr.sources.length).toBeGreaterThan(0);
  });

  it('throws for an unknown slug', () => {
    expect(() => service.get('nope')).toThrow();
  });

  it('produces a stable offline bundle with a checksum', () => {
    const a = service.bundle();
    const b = service.bundle();
    expect(a.checksum).toBe(b.checksum);
    expect(a.topics.length).toBe(16);
  });

  // SAFETY: no authored guidance may contain prescription or diagnosis language.
  it('contains no prescription or diagnosis language in any step or dont', () => {
    for (const topic of GUIDANCE_TOPICS) {
      for (const step of topic.steps) {
        expect(containsUnsafeMedicalClaim(step.text)).toBe(false);
      }
      for (const d of topic.donts) {
        expect(containsUnsafeMedicalClaim(d)).toBe(false);
      }
    }
  });
});
