import { UpstreamError, ValidationError } from '../domain/errors.ts';
import type { GeoPoint } from '../../types.ts';

/**
 * Reverse-geocodes GPS coordinates to a human-readable place name.
 *
 * Uses OpenStreetMap's Nominatim (free, no API key) since there's no
 * confirmed budget for a paid provider — swappable behind this same
 * function signature if that changes later (Google Geocoding, MapMyIndia).
 * Nominatim's usage policy caps unauthenticated use at ~1 req/sec and
 * requires an identifying User-Agent; fine for this pass, but a
 * production deployment at real farmer volume would need a paid provider
 * or a self-hosted Nominatim instance.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new ValidationError('Invalid coordinates.');
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'HarvestPlanner/1.0 (agricultural market intelligence app)' },
    });
    if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

    const data = (await response.json()) as { address?: Record<string, string> };
    const address = data.address ?? {};
    const district = address.state_district || address.county || address.city_district;
    const place = address.city || address.town || address.village || address.suburb;
    const state = address.state;

    const parts = [place, district, state].filter(Boolean);
    if (parts.length === 0) throw new Error('No address components returned.');

    return parts.slice(0, 2).join(', ');
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    throw new UpstreamError('Could not determine your location. Please enter it manually.');
  }
}

/**
 * Forward-geocodes a free-text place name to coordinates, via the same
 * Nominatim service (no separate API/key needed). Biased to India since
 * this app's markets are all Indian — resolves ambiguous names like
 * "Villupuram" to the right country instead of a same-named place abroad.
 */
export async function forwardGeocode(query: string): Promise<GeoPoint> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new ValidationError('A location is required.');
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&countrycodes=in&limit=1`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'HarvestPlanner/1.0 (agricultural market intelligence app)' },
    });
    if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

    const results = (await response.json()) as { lat: string; lon: string }[];
    if (!results.length) {
      throw new UpstreamError(`Could not find "${trimmed}". Try a nearby city or district name.`);
    }

    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    console.error('Forward geocoding failed:', err);
    throw new UpstreamError('Could not resolve that location right now. Please try again.');
  }
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two coordinates, in kilometers. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Simple average-speed heuristic, not a routing engine — deliberately
// presented to users as an estimate, not turn-by-turn ETA precision.
const ASSUMED_AVG_SPEED_KMPH = 28;

export function estimateTravelTimeMins(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / ASSUMED_AVG_SPEED_KMPH) * 60));
}
