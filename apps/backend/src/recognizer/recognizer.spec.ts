import { NotFoundException } from '@nestjs/common';
import { RecognizerService } from './recognizer.service';
import { RECOGNIZER_NODES, ROOT_ID } from './recognizer.data';
import { findTopic } from '../guidance/guidance.data';
import { containsUnsafeMedicalClaim } from '../triage/triage.guardrails';
import { EmergencyNumberService } from '../emergency-number/emergency-number.service';

describe('RecognizerService', () => {
  const svc = new RecognizerService(new EmergencyNumberService());

  it('boots with a valid tree (every invariant holds)', () => {
    expect(() => svc.onModuleInit()).not.toThrow();
  });

  it('starts at the root "What\'s happening?" question', () => {
    const root = svc.start();
    expect(root.id).toBe(ROOT_ID);
    expect(root.options.length).toBeGreaterThan(0);
  });

  it('branches collapsed → infant to the infant protocol, critical + call', () => {
    const branch = svc.node('collapsed-age');
    const infant = branch.options.find((o) => /baby|infant|under 1/i.test(o.label));
    expect(infant?.route).toBeDefined();
    expect(infant!.route!.guidanceSlug).toBe('child-emergency');
    expect(infant!.route!.severity).toBe('CRITICAL');
    expect(infant!.route!.callEmergency).toBe(true);
  });

  it('every terminal routes to a real guidance topic', () => {
    for (const node of RECOGNIZER_NODES) {
      for (const opt of node.options) {
        if (opt.route) expect(findTopic(opt.route.guidanceSlug)).toBeDefined();
      }
    }
  });

  // Safety: an infant must NEVER get abdominal thrusts (back blows + chest
  // thrusts only). This mirrors the infant-flow protocol safety check.
  it('never tells a bystander to give an infant abdominal thrusts', () => {
    const chokeInfant = svc
      .node('choking-age')
      .options.find((o) => /baby|infant|under 1/i.test(o.label));
    expect(chokeInfant!.route!.immediateAction).not.toMatch(/abdominal thrust/i);
    expect(chokeInfant!.route!.guidanceSlug).toBe('child-emergency');
  });

  it('no immediate action contains a diagnosis or prescription', () => {
    for (const node of RECOGNIZER_NODES) {
      for (const opt of node.options) {
        if (opt.route) {
          expect(containsUnsafeMedicalClaim(opt.route.immediateAction)).toBe(false);
        }
      }
    }
  });

  it('throws NotFound for an unknown node', () => {
    expect(() => svc.node('does-not-exist')).toThrow(NotFoundException);
  });

  it('surfaces the local dial number for a country, else the 112 fallback', () => {
    expect(svc.start('GB').emergencyNumber).toBe('999');
    expect(svc.start('us').emergencyNumber).toBe('911'); // case-insensitive
    expect(svc.start().emergencyNumber).toBe('112'); // no country → fallback
    expect(svc.start('ZZ').emergencyNumber).toBe('112'); // unknown → fallback
  });

  it('bundle carries a checksum for offline caching', () => {
    const b = svc.bundle();
    expect(b.checksum).toMatch(/^[0-9a-f]{16}$/);
    expect(b.rootId).toBe(ROOT_ID);
  });
});
