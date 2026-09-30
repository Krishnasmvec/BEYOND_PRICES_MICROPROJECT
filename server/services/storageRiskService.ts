import { supabase } from './supabaseClient.ts';
import { UpstreamError } from '../domain/errors.ts';
import type { StorageRisk, StorageRiskLevel, MarketWeather } from '../../shared/types.ts';

// Raw row shape verified column-by-column against the live Supabase project
// during STEP 10 (both max_storage_days and max_days are genuinely distinct
// real columns — not a guess/merge, see marketService.ts's MarketProduct
// stock_quantity precedent for the same "prefer whichever real column is
// non-null" pattern).
interface RawStorageAdvisoryRow {
  advisory_id: string;
  product_id: string;
  storage_type: string | null;
  spoilage_risk: string | null;
  max_storage_days: number | null;
  max_days: number | null;
  ideal_temperature: number | null;
  humidity_range: string | null;
  recommendation: string | null;
}

const STORAGE_ADVISORY_COLUMNS =
  'advisory_id,product_id,storage_type,spoilage_risk,max_storage_days,max_days,ideal_temperature,humidity_range,recommendation';

// How far current conditions can drift from the advisory's ideal before
// counting as a real risk factor, not just seeded-data jitter.
const TEMP_TOLERANCE_C = 3;

/** One flat `in.()` query — never one query per product. */
export async function getStorageAdvisories(productIds: string[]): Promise<Map<string, RawStorageAdvisoryRow>> {
  const result = new Map<string, RawStorageAdvisoryRow>();
  if (productIds.length === 0) return result;

  const { data, error } = await supabase.from('storage_advisory').select(STORAGE_ADVISORY_COLUMNS).in('product_id', productIds);
  if (error) {
    console.error('Supabase storage_advisory query failed:', error);
    throw new UpstreamError('Could not load storage guidance right now. Please try again.');
  }
  for (const row of (data ?? []) as RawStorageAdvisoryRow[]) {
    result.set(row.product_id, row);
  }
  return result;
}

/** Parses a free-text range like "60-70%" defensively; returns null (never guesses) if unparseable. */
function parseHumidityRange(raw: string | null): { min: number; max: number } | null {
  if (!raw) return null;
  const numbers = raw.match(/\d+(\.\d+)?/g);
  if (!numbers || numbers.length < 2) return null;
  const [min, max] = numbers.map(Number).sort((a, b) => a - b);
  return { min, max };
}

function normalizeSpoilageRiskHint(raw: string | null): 'high' | 'low' | null {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (/(high|severe|critical)/.test(normalized)) return 'high';
  if (/(low|minimal|slight)/.test(normalized)) return 'low';
  return null;
}

/**
 * Deterministic, rule-based — never Gemini-scored. Compares the advisory's
 * stated ideal conditions against the given market's real weather row.
 * `weather` is null when that district has no weather row at all, in which
 * case climate suitability simply can't be assessed (never assumed benign).
 */
export function computeStorageRisk(
  productId: string,
  productName: string,
  advisory: RawStorageAdvisoryRow | undefined,
  weather: MarketWeather | null
): StorageRisk {
  if (!advisory) {
    return {
      productId,
      productName,
      level: 'unavailable',
      reason: 'No storage guidance is available for this product yet.',
      storageType: null,
      maxStorageDays: null,
      idealTemperature: null,
      humidityRange: null,
      recommendation: null,
    };
  }

  const maxStorageDays = advisory.max_storage_days ?? advisory.max_days ?? null;
  const spoilageHint = normalizeSpoilageRiskHint(advisory.spoilage_risk);

  const reasons: string[] = [];
  let riskPoints = 0; // 0 = low, higher = worse

  if (spoilageHint === 'high') { riskPoints += 2; reasons.push('This product is flagged as high spoilage risk.'); }
  if (spoilageHint === 'low') { riskPoints -= 1; }

  if (weather?.temperature != null && advisory.ideal_temperature != null) {
    const diff = weather.temperature - advisory.ideal_temperature;
    if (diff > TEMP_TOLERANCE_C) { riskPoints += 2; reasons.push(`Current temperature (${weather.temperature}°C) is above the ideal ${advisory.ideal_temperature}°C.`); }
    else if (diff < -TEMP_TOLERANCE_C) { riskPoints += 1; reasons.push(`Current temperature (${weather.temperature}°C) is below the ideal ${advisory.ideal_temperature}°C.`); }
  }

  const humidityRange = parseHumidityRange(advisory.humidity_range);
  if (weather?.humidity != null && humidityRange) {
    if (weather.humidity > humidityRange.max) { riskPoints += 1; reasons.push(`Current humidity (${weather.humidity}%) is above the recommended ${advisory.humidity_range}.`); }
    else if (weather.humidity < humidityRange.min) { riskPoints += 1; reasons.push(`Current humidity (${weather.humidity}%) is below the recommended ${advisory.humidity_range}.`); }
  }

  let level: StorageRiskLevel;
  if (riskPoints >= 3) level = 'high';
  else if (riskPoints >= 1) level = 'moderate';
  else level = 'low';

  const reason = reasons.length > 0
    ? reasons.join(' ')
    : 'Current conditions are within, or close to, the recommended range for this product.';

  return {
    productId,
    productName,
    level,
    reason,
    storageType: advisory.storage_type,
    maxStorageDays,
    idealTemperature: advisory.ideal_temperature,
    humidityRange: advisory.humidity_range,
    recommendation: advisory.recommendation,
  };
}
