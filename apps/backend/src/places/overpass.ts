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
const logger = new Logger('Places');

// Google Places types (it has no AED/defibrillator type, so those stay OSM-only).
const GOOGLE_TYPE: Partial<Record<PlaceType, string>> = { hospital: 'hospital', pharmacy: 'pharmacy' };
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Nearby places keyed on the caller's real coordinates — never a hardcoded city.
 * Google Places is primary when GOOGLE_MAPS_API_KEY is set (hospitals/pharmacies);
 * OpenStreetMap Overpass is the keyless fallback and the sole source for AEDs.
 */
export async function nearbyPlaces(
  type: PlaceType,
  origin: LatLng,
  radiusM = 4000,
  limit = 10,
): Promise<Place[]> {
  const gtype = GOOGLE_TYPE[type];
  if (GOOGLE_KEY && gtype) {
    const g = await googlePlaces(gtype, origin, radiusM, limit);
    if (g.length > 0) return g;
  }
  return overpassPlaces(type, origin, radiusM, limit);
}

/** Google Places Nearby Search (needs a key + the Places API enabled). */
async function googlePlaces(
  gtype: string,
  origin: LatLng,
  radiusM: number,
  limit: number,
): Promise<Place[]> {
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${origin.latitude},${origin.longitude}&radius=${radiusM}&type=${gtype}&key=${GOOGLE_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const json = (await res.json()) as { status: string; results?: GoogleResult[] };
    if (json.status !== 'OK') {
      if (json.status !== 'ZERO_RESULTS') logger.warn(`Google Places status: ${json.status}`);
      return [];
    }
    return (json.results ?? [])
      .map((r) => {
        const loc = r.geometry?.location;
        if (!loc) return null;
        return {
          name: r.name ?? 'Hospital',
          address: r.vicinity ?? null,
          access: r.opening_hours?.open_now ? 'Open now' : null,
          latitude: loc.lat,
          longitude: loc.lng,
          distanceKm: round(haversineKm(origin, { latitude: loc.lat, longitude: loc.lng })),
        } as Place;
      })
      .filter((p): p is Place => p !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  } catch (err) {
    logger.warn(`Google Places failed: ${(err as Error).message}`);
    return [];
  }
}

interface GoogleResult {
  name?: string;
  vicinity?: string;
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: { open_now?: boolean };
}

async function overpassPlaces(
  type: PlaceType,
  origin: LatLng,
  radiusM: number,
  limit: number,
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
