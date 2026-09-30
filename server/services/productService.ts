import { supabase } from './supabaseClient.ts';
import { UpstreamError } from '../domain/errors.ts';
import type { ProductSummary } from '../../shared/types.ts';

// Raw row shape verified against the live Supabase project (same discipline
// as marketService.ts — explicit columns, never select=*).
interface RawProductRow {
  product_id: string;
  product_name: string;
  category: string | null;
  unit: string | null;
  description: string | null;
  image_url: string | null;
}

const PRODUCT_COLUMNS = 'product_id,product_name,category,unit,description,image_url';

function toSummary(row: RawProductRow): ProductSummary {
  return {
    productId: row.product_id,
    productName: row.product_name,
    category: row.category,
    unit: row.unit ?? 'kg',
  };
}

/**
 * Powers GET /api/farmer/products. One flat query — a case-insensitive
 * partial match on product_name when `query` is given, otherwise the full
 * catalog (167 rows today, cheap either way) capped at `limit`.
 */
export async function searchProducts(query?: string, category?: string, limit = 50): Promise<ProductSummary[]> {
  let builder = supabase.from('products').select(PRODUCT_COLUMNS).order('product_name').limit(limit);
  if (query && query.trim()) {
    builder = builder.ilike('product_name', `%${query.trim()}%`);
  }
  if (category && category.trim()) {
    builder = builder.eq('category', category.trim());
  }

  const { data, error } = await builder;
  if (error) {
    console.error('Supabase product search failed:', error);
    throw new UpstreamError('Could not load products right now. Please try again.');
  }
  return ((data ?? []) as RawProductRow[]).map(toSummary);
}

/** One flat `in.()` query — used by farmerAnalysisService to resolve the farmer's selected product ids. */
export async function getProductsByIds(productIds: string[]): Promise<ProductSummary[]> {
  if (productIds.length === 0) return [];
  const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS).in('product_id', productIds);
  if (error) {
    console.error('Supabase product lookup failed:', error);
    throw new UpstreamError('Could not load selected products right now. Please try again.');
  }
  return ((data ?? []) as RawProductRow[]).map(toSummary);
}
