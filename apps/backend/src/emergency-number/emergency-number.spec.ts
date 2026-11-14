import { EmergencyNumberService } from './emergency-number.service';
import { numberForCountry, DEFAULT_EMERGENCY_NUMBER } from './emergency-number.data';

describe('EmergencyNumber', () => {
  const svc = new EmergencyNumberService();

  it('maps known countries to their medical emergency number', () => {
    expect(numberForCountry('US')).toBe('911');
    expect(numberForCountry('GB')).toBe('999');
    expect(numberForCountry('AU')).toBe('000');
    expect(numberForCountry('JP')).toBe('119');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(numberForCountry(' gb ')).toBe('999');
  });

  it('falls back to 112 for unknown or missing country', () => {
    expect(numberForCountry('ZZ')).toBe(DEFAULT_EMERGENCY_NUMBER);
    expect(numberForCountry('')).toBe(DEFAULT_EMERGENCY_NUMBER);
    expect(numberForCountry(undefined)).toBe('112');
  });

  it('service echoes the normalized country and fallback', () => {
    const res = svc.forCountry('gb');
    expect(res).toEqual({ country: 'GB', number: '999', fallback: '112' });
    expect(svc.forCountry().country).toBeNull();
  });
});
