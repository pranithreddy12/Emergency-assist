import { haversineKm } from '../common/geo/geo.util';
import { MockMapsProvider } from './providers/mock-maps.provider';

describe('geo + mock maps', () => {
  // Known reference: SF City Hall -> SF General is ~2.4 km straight line.
  const cityHall = { latitude: 37.7793, longitude: -122.4193 };
  const sfGeneral = { latitude: 37.7559, longitude: -122.4048 };

  it('computes a plausible haversine distance', () => {
    const km = haversineKm(cityHall, sfGeneral);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(4);
  });

  it('returns 0 distance for identical points', () => {
    expect(haversineKm(cityHall, cityHall)).toBeCloseTo(0, 5);
  });

  it('mock provider derives travel time from distance and speed', async () => {
    const maps = new MockMapsProvider();
    const [est] = await maps.travelEstimates(cityHall, [sfGeneral]);
    expect(est.distanceKm).toBeGreaterThan(0);
    // road distance >= straight line
    expect(est.distanceKm).toBeGreaterThanOrEqual(haversineKm(cityHall, sfGeneral));
    // duration consistent with ~40km/h
    expect(est.durationSeconds).toBeGreaterThan(0);
  });

  it('estimates for many destinations in order', async () => {
    const maps = new MockMapsProvider();
    const ests = await maps.travelEstimates(cityHall, [sfGeneral, cityHall]);
    expect(ests.length).toBe(2);
    expect(ests[1].distanceKm).toBeCloseTo(0, 2); // self
  });
});
