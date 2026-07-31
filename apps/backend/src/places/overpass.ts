import { Logger } from '@nestjs/common';
import { haversineKm, round, LatLng } from '../common/geo/geo.util';

export interface Place {
  name: string;
  address: string | null;
  access: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

// OSM tag filters per place type. Worldwide, no API key.
const FILTERS: Record<string, string> = {
  defibrillator: 'node["emergency"="defibrillator"]',
  hospital: 'nwr["amenity"="hospital"]',
  pharmacy: 'nwr["amenity"="pharmacy"]',
};

export type PlaceType = keyof typeof FILTERS;

// Public instance is rate-limited and 504s on big area queries under load.
// Point OVERPASS_URL at a self-hosted mirror in production.
const OVERPASS = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const logger = new Logger('Overpass');

/**
 * Real nearby places from OpenStreetMap Overpass, keyed on the caller's actual
 * coordinates — no seeded/hardcoded city, works anywhere on earth, no key.
 * Returns [] on error; the caller decides on any fallback.
 *
 * ponytail: hits the public Overpass instance directly. For production traffic,
 * point OVERPASS_URL at a self-hosted mirror + cache — the public one is rate-limited.
 */
export async function nearbyPlaces(
  type: PlaceType,
  origin: LatLng,
  radiusM = 4000,
  limit = 10,
): Promise<Place[]> {
  const filter = FILTERS[type];
  if (!filter) return [];
  const q =
    `[out:json][timeout:25];(${filter}(around:${radiusM},${origin.latitude},${origin.longitude}););out tags center ${Math.min(limit * 4, 60)};`;
  try {
    // GET with a descriptive User-Agent — the public instance 406s anonymous
    // POSTs. Abort after 22s so a slow/hung Overpass never blocks the caller.
    const res = await fetch(`${OVERPASS}?data=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'EmergencyAI/1.0 (bystander first-aid app)', Accept: 'application/json' },
      signal: AbortSignal.timeout(22_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { elements?: OsmElement[] };
    return (json.elements ?? [])
      .map((el) => toPlace(el, origin))
      .filter((p): p is Place => p !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  } catch (err) {
    logger.warn(`Overpass query failed (${type}): ${(err as Error).message}`);
    return [];
  }
}

interface OsmElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function toPlace(el: OsmElement, origin: LatLng): Place | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;
  const t = el.tags ?? {};
  const address =
    [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') || t['addr:full'] || null;
  return {
    name: t.name ?? t['defibrillator:location'] ?? t.operator ?? 'Public access point',
    address,
    access: t['defibrillator:location'] ?? t.access ?? t['opening_hours'] ?? null,
    latitude: lat,
    longitude: lon,
    distanceKm: round(haversineKm(origin, { latitude: lat, longitude: lon })),
  };
}
