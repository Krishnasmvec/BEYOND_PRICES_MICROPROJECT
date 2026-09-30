import { supabase } from './supabaseClient.ts';

export interface WeatherDataPoint {
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
  weatherCondition: string | null;
  alertLevel: string | null;
  updatedAt: string | null;
  source: string;
  status: 'live' | 'database' | 'fallback' | 'unavailable';
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code === 56 || code === 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rainy';
  if (code === 66 || code === 67) return 'Freezing Rain';
  if (code >= 71 && code <= 75) return 'Snowy';
  if (code === 77) return 'Snow Grains';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code === 85 || code === 86) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm with Hail';
  return 'Clear';
}

interface CacheEntry {
  data: WeatherDataPoint;
  expiresAt: number;
}

const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function fetchLiveWeather(
  lat: number,
  lng: number,
  locationText?: string
): Promise<WeatherDataPoint> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Open-Meteo status ${response.status}`);

    const payload = (await response.json()) as any;
    const current = payload.current;
    if (!current) throw new Error('Invalid Open-Meteo response structure');

    const result: WeatherDataPoint = {
      temperature: current.temperature_2m ?? null,
      humidity: current.relative_humidity_2m ?? null,
      rainfall: current.rain ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      weatherCondition: current.weather_code !== undefined ? mapWeatherCode(current.weather_code) : null,
      alertLevel: 'None', // Open-Meteo does not provide local alerts
      updatedAt: new Date().toISOString(),
      source: 'Open-Meteo API',
      status: 'live',
    };

    weatherCache.set(cacheKey, { data: result, expiresAt: now + CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.warn(`Live weather API failed for lat=${lat}, lng=${lng}:`, err);
    // Fall back to database weather matching by location text or nearest district
    return await fetchDatabaseWeatherFallback(locationText);
  }
}

async function fetchDatabaseWeatherFallback(locationText?: string): Promise<WeatherDataPoint> {
  try {
    const { data, error } = await supabase
      .from('weather')
      .select('district,temperature,humidity,rainfall,wind_speed,weather_condition,alert_level,updated_at');

    if (error) throw error;
    const rows = data ?? [];

    let matchedRow = rows[0]; // fallback to first record if no matches found
    if (locationText) {
      const normalized = locationText.toLowerCase();
      const match = rows.find((row) => normalized.includes(row.district.toLowerCase()));
      if (match) matchedRow = match;
    }

    if (!matchedRow) {
      throw new Error('No weather rows found in database');
    }

    return {
      temperature: matchedRow.temperature,
      humidity: matchedRow.humidity,
      rainfall: matchedRow.rainfall,
      windSpeed: matchedRow.wind_speed,
      weatherCondition: matchedRow.weather_condition,
      alertLevel: matchedRow.alert_level,
      updatedAt: matchedRow.updated_at,
      source: 'Database Fallback',
      status: 'database',
    };
  } catch (err) {
    console.error('Database weather fallback failed:', err);
    return {
      temperature: null,
      humidity: null,
      rainfall: null,
      windSpeed: null,
      weatherCondition: null,
      alertLevel: null,
      updatedAt: null,
      source: 'Unavailable',
      status: 'unavailable',
    };
  }
}
