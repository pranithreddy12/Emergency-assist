/**
 * Country → medical/ambulance emergency number (ROADMAP principle #4: right info
 * for *this* place). This lives server-side so a wrong number can be corrected
 * without shipping a new app build; the mobile client keeps its own offline
 * locale-based copy for the no-signal path.
 *
 * The map holds only countries whose number differs from 112 — the GSM-universal
 * fallback that reaches emergency services across the EU and on most networks
 * worldwide. Everything unmapped (and unknown) resolves to 112, which is correct
 * for the traveler edge case. Extend as numbers are verified.
 * ISO 3166-1 alpha-2 keys.
 */

export const DEFAULT_EMERGENCY_NUMBER = '112';

const EXCEPTIONS: Record<string, string> = {
  US: '911',
  CA: '911',
  MX: '911',
  GB: '999',
  IE: '999',
  AU: '000',
  NZ: '111',
  JP: '119',
  KR: '119',
  CN: '120',
  BR: '192',
  SG: '995',
  HK: '999',
  ZA: '10177',
  RU: '103',
  AR: '107',
};

/** Pure lookup. Unknown/empty country → the 112 universal fallback. */
export function numberForCountry(country?: string): string {
  if (!country) return DEFAULT_EMERGENCY_NUMBER;
  return EXCEPTIONS[country.trim().toUpperCase()] ?? DEFAULT_EMERGENCY_NUMBER;
}
