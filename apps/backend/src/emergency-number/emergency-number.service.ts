import { Injectable } from '@nestjs/common';
import { DEFAULT_EMERGENCY_NUMBER, numberForCountry } from './emergency-number.data';

@Injectable()
export class EmergencyNumberService {
  /** Resolve the number to dial for a country (ISO 3166-1 alpha-2). */
  forCountry(country?: string) {
    return {
      country: country ? country.trim().toUpperCase() : null,
      number: numberForCountry(country),
      fallback: DEFAULT_EMERGENCY_NUMBER,
    };
  }
}
