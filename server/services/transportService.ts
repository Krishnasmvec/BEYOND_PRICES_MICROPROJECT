import { supabase } from './supabaseClient.ts';
import { UpstreamError } from '../domain/errors.ts';
import type { FarmerTransportPoolEntry } from '../../shared/types.ts';

// Raw row shape verified against the live Supabase project during STEP 10 —
// genuinely this sparse. No capacity/driver/price columns exist; never
// display fields that aren't in this list.
interface RawTransportPoolRow {
  pool_id: string;
  market_id: string;
  vehicle_type: string | null;
  status: string | null;
  updated_at: string | null;
}

const TRANSPORT_POOL_COLUMNS = 'pool_id,market_id,vehicle_type,status,updated_at';

function toEntry(row: RawTransportPoolRow): FarmerTransportPoolEntry {
  return {
    poolId: row.pool_id,
    marketId: row.market_id,
    vehicleType: row.vehicle_type,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

/**
 * One flat query for the whole table (25 rows today — cheap to fetch in
 * full and group in memory rather than filtering per market_id, which would
 * be one query per candidate market).
 */
export async function getTransportPoolsByMarket(): Promise<Map<string, FarmerTransportPoolEntry[]>> {
  const { data, error } = await supabase.from('transport_pool').select(TRANSPORT_POOL_COLUMNS);
  if (error) {
    console.error('Supabase transport_pool query failed:', error);
    throw new UpstreamError('Could not load transport pool data right now. Please try again.');
  }

  const byMarket = new Map<string, FarmerTransportPoolEntry[]>();
  for (const row of (data ?? []) as RawTransportPoolRow[]) {
    const list = byMarket.get(row.market_id) ?? [];
    list.push(toEntry(row));
    byMarket.set(row.market_id, list);
  }
  return byMarket;
}
