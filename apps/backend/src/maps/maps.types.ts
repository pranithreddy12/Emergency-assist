import { LatLng } from '../common/geo/geo.util';

export interface TravelEstimate {
  distanceKm: number;
  durationSeconds: number;
}

export const MAPS_PROVIDER = Symbol('MAPS_PROVIDER');

export interface MapsProvider {
  readonly name: 'mock' | 'google';
  /** Travel distance & time from one origin to many destinations. */
  travelEstimates(origin: LatLng, destinations: LatLng[]): Promise<TravelEstimate[]>;
  /** Best-effort reverse geocode; may return null. */
  reverseGeocode(point: LatLng): Promise<string | null>;
}
