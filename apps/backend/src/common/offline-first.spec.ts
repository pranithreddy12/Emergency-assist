/**
 * Offline-first guard (ROADMAP principles #2 and #3: the life-saving path must
 * work for a guest, with no account and no network). This is a fast, no-DB,
 * no-network reflection test: it fails the build if any critical bystander
 * endpoint loses its @Public() marker (which would hide it behind auth) or if
 * the guidance / recognizer content stops shipping an offline bundle.
 *
 * It deliberately asserts the metadata, not an HTTP round-trip — the whole point
 * is that these must never require the network to begin with.
 */
import 'reflect-metadata';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { GuidanceController } from '../guidance/guidance.controller';
import { GuidanceService } from '../guidance/guidance.service';
import { RecognizerController } from '../recognizer/recognizer.controller';
import { RecognizerService } from '../recognizer/recognizer.service';
import { EmergencyNumberController } from '../emergency-number/emergency-number.controller';
import { EmergencyNumberService } from '../emergency-number/emergency-number.service';
import { AedController } from '../aed/aed.controller';

// Every handler a panicked bystander needs before they can sign in.
const CRITICAL_ROUTES: Array<[new (...args: any[]) => any, string]> = [
  [GuidanceController, 'list'],
  [GuidanceController, 'bundle'],
  [GuidanceController, 'get'],
  [RecognizerController, 'start'],
  [RecognizerController, 'bundle'],
  [RecognizerController, 'node'],
  [EmergencyNumberController, 'forCountry'],
  [AedController, 'nearby'],
];

describe('offline-first guard', () => {
  it.each(CRITICAL_ROUTES)('%p.%s is reachable without auth (@Public)', (ctrl, method) => {
    const handler = ctrl.prototype[method];
    expect(handler).toBeDefined();
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
  });

  it('guidance ships an offline bundle with a checksum', () => {
    const bundle = new GuidanceService().bundle();
    expect(bundle.checksum).toMatch(/^[0-9a-f]{16}$/);
    expect(bundle.topics.length).toBeGreaterThan(0);
  });

  it('recognizer ships an offline bundle with a checksum', () => {
    const bundle = new RecognizerService(new EmergencyNumberService()).bundle();
    expect(bundle.checksum).toMatch(/^[0-9a-f]{16}$/);
    expect(bundle.nodes.length).toBeGreaterThan(0);
  });
});
