import { haversineDistanceKm, estimateTravelTimeMins } from './geocodingService.ts';
import type { GeoPoint } from '../../shared/types.ts';

export interface RouteResponse {
  distanceKm: number;
  durationMinutes: number;
  routeAvailable: boolean;
  fetchedAt: string;
  source: string;
  status: 'live' | 'fallback' | 'unavailable';
}

interface CacheEntry {
  data: RouteResponse;
  expiresAt: number;
}

const routeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export async function getLiveRoute(
  origin: GeoPoint,
  destination: GeoPoint
): Promise<RouteResponse> {
  const cacheKey = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}:${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`;
  const now = Date.now();
  const cached = routeCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    // OSRM coordinates format: longitude,latitude
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM status ${response.status}`);

    const payload = (await response.json()) as any;
    if (payload.code !== 'Ok' || !payload.routes || payload.routes.length === 0) {
      throw new Error(`OSRM returned code ${payload.code}`);
    }

    const route = payload.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));

    const result: RouteResponse = {
      distanceKm,
      durationMinutes,
      routeAvailable: true,
      fetchedAt: new Date().toISOString(),
      source: 'OSRM Routing API',
      status: 'live',
    };

    routeCache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.warn(`OSRM routing failed from ${origin.lat},${origin.lng} to ${destination.lat},${destination.lng}:`, err);
    // Fallback using haversine distance and estimated travel time
    const distanceKm = Math.round(haversineDistanceKm(origin, destination) * 10) / 10;
    const durationMinutes = estimateTravelTimeMins(distanceKm);

    return {
      distanceKm,
      durationMinutes,
      routeAvailable: false,
      fetchedAt: new Date().toISOString(),
      source: 'Haversine Estimation Fallback',
      status: 'fallback',
    };
  }
}
