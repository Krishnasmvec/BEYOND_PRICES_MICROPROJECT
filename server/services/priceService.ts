import { supabase } from './supabaseClient.ts';
import { UpstreamError } from '../domain/errors.ts';
import type { PriceInsight } from '../../types.ts';

// Raw row shape verified against the live Supabase project.
interface RawPriceHistoryRow {
  market_product_id: string;
  price: number;
  recorded_at: string;
}

const PRICE_HISTORY_COLUMNS = 'market_product_id,price,recorded_at';

// Below this many data points in the trend window, a trend claim would be
// noise, not signal — report "insufficient data" instead of guessing.
const MIN_TREND_POINTS = 3;
const TREND_WINDOW_DAYS = 7;
// A move smaller than this is treated as flat rather than a real trend —
// seeded reference data has enough natural jitter that anything smaller is
// not a meaningful signal.
const STABLE_THRESHOLD_PCT = 2;

function emptyInsight(productId: string): PriceInsight {
  return { productId, currentPrice: null, sevenDayAvg: null, trend: 'insufficient_data', dataPoints: 0 };
}

/**
 * Powers price trend display in farmerAnalysisService. One flat query for
 * every requested market_product_id — never one query per listing. The
 * 7-day window is anchored to each listing's own most recent recorded_at
 * (not wall-clock "now"), since this is seeded reference data rather than a
 * live feed and "now" could fall entirely outside the seeded date range.
 */
export async function getPriceInsights(
  marketProductIds: string[]
): Promise<Map<string, Omit<PriceInsight, 'productId'>>> {
  const result = new Map<string, Omit<PriceInsight, 'productId'>>();
  if (marketProductIds.length === 0) return result;

  const { data, error } = await supabase
    .from('price_history')
    .select(PRICE_HISTORY_COLUMNS)
    .in('market_product_id', marketProductIds)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('Supabase price_history query failed:', error);
    throw new UpstreamError('Could not load price history right now. Please try again.');
  }

  const byListing = new Map<string, RawPriceHistoryRow[]>();
  for (const row of (data ?? []) as RawPriceHistoryRow[]) {
    const list = byListing.get(row.market_product_id) ?? [];
    list.push(row);
    byListing.set(row.market_product_id, list);
  }

  for (const [marketProductId, rows] of byListing) {
    const current = rows[0].price; // already sorted desc
    const latestDate = new Date(rows[0].recorded_at).getTime();
    const windowStart = latestDate - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const windowRows = rows.filter((r) => new Date(r.recorded_at).getTime() >= windowStart);

    if (windowRows.length < MIN_TREND_POINTS) {
      result.set(marketProductId, { currentPrice: current, sevenDayAvg: null, trend: 'insufficient_data', dataPoints: windowRows.length });
      continue;
    }

    const avg = windowRows.reduce((sum, r) => sum + r.price, 0) / windowRows.length;
    const deltaPct = avg > 0 ? ((current - avg) / avg) * 100 : 0;
    const trend = Math.abs(deltaPct) < STABLE_THRESHOLD_PCT ? 'stable' : deltaPct > 0 ? 'increasing' : 'decreasing';

    result.set(marketProductId, { currentPrice: current, sevenDayAvg: Math.round(avg * 100) / 100, trend, dataPoints: windowRows.length });
  }

  return result;
}

export { emptyInsight };
