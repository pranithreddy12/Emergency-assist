import { Injectable, Logger } from '@nestjs/common';
import { LatLng } from '../../common/geo/geo.util';
import { MapsProvider, TravelEstimate } from '../maps.types';
import { MockMapsProvider } from './mock-maps.provider';

/**
 * Google Maps-backed provider (Distance Matrix + Geocoding). Requires
 * GOOGLE_MAPS_API_KEY; on any failure or missing key it transparently falls
 * back to the deterministic mock so hospital search always works.
 */
@Injectable()
export class GoogleMapsProvider implements MapsProvider {
  readonly name = 'google' as const;
  private readonly logger = new Logger(GoogleMapsProvider.name);
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY;

  constructor(private readonly fallback: MockMapsProvider) {
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY missing; Google maps provider falls back to mock.');
    }
  }

  async travelEstimates(origin: LatLng, destinations: LatLng[]): Promise<TravelEstimate[]> {
    if (!this.apiKey) return this.fallback.travelEstimates(origin, destinations);
    try {
      const origins = `${origin.latitude},${origin.longitude}`;
      const dests = destinations.map((d) => `${d.latitude},${d.longitude}`).join('|');
      const url =
        `https://maps.googleapis.com/maps/api/distancematrix/json` +
        `?origins=${origins}&destinations=${encodeURIComponent(dests)}` +
        `&departure_time=now&key=${this.apiKey}`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        rows?: { elements?: { distance?: { value: number }; duration?: { value: number } }[] }[];
      };
      const elements = json.rows?.[0]?.elements ?? [];
      return destinations.map((_, i) => {
        const el = elements[i];
        if (!el?.distance || !el?.duration) {
          // Fill gaps from the mock rather than dropping a hospital.
          return { distanceKm: 0, durationSeconds: 0 };
        }
        return {
          distanceKm: Math.round((el.distance.value / 1000) * 100) / 100,
          durationSeconds: el.duration.value,
        };
      });
    } catch (err) {
      this.logger.error('Google Distance Matrix failed; using mock', err as Error);
      return this.fallback.travelEstimates(origin, destinations);
    }
  }

  async reverseGeocode(point: LatLng): Promise<string | null> {
    if (!this.apiKey) return this.fallback.reverseGeocode(point);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?latlng=${point.latitude},${point.longitude}&key=${this.apiKey}`;
      const res = await fetch(url);
      const json = (await res.json()) as { results?: { formatted_address?: string }[] };
      return json.results?.[0]?.formatted_address ?? null;
    } catch {
      return this.fallback.reverseGeocode(point);
    }
  }
}
