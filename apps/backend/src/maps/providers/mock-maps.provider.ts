import { Injectable } from '@nestjs/common';
import { LatLng, haversineKm, round } from '../../common/geo/geo.util';
import { MapsProvider, TravelEstimate } from '../maps.types';

/**
 * Deterministic maps mock. Estimates travel time from straight-line distance
 * with a road-winding factor and an urban average speed, so the app has
 * realistic ETAs without a Google Maps key.
 */
@Injectable()
export class MockMapsProvider implements MapsProvider {
  readonly name = 'mock' as const;

  // Roads are ~30% longer than straight-line; assume ~40 km/h urban average.
  private static readonly ROAD_FACTOR = 1.3;
  private static readonly AVG_SPEED_KMH = 40;

  async travelEstimates(origin: LatLng, destinations: LatLng[]): Promise<TravelEstimate[]> {
    return destinations.map((dest) => {
      const straight = haversineKm(origin, dest);
      const distanceKm = round(straight * MockMapsProvider.ROAD_FACTOR);
      const durationSeconds = Math.round(
        (distanceKm / MockMapsProvider.AVG_SPEED_KMH) * 3600,
      );
      return { distanceKm, durationSeconds };
    });
  }

  async reverseGeocode(point: LatLng): Promise<string | null> {
    return `~${round(point.latitude, 4)}, ${round(point.longitude, 4)}`;
  }
}
