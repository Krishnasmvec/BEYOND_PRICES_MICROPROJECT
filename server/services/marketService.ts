import { supabase } from './supabaseClient.ts';
import { haversineDistanceKm, estimateTravelTimeMins } from './geocodingService.ts';
import { UpstreamError } from '../domain/errors.ts';
import type {
  GeoPoint,
  NearbyMarket,
  MarketProduct,
  MarketLogistics,
  MarketWeather,
  ProductAvailability,
  ProductFreshness,
} from '../../types.ts';

// Raw row shapes exactly as verified against the live Supabase project
// (column-by-column, via the REST API — not guessed from the task spec,
// which had some names wrong: markets has no market_type/location column,
// products.image is actually image_url). See the plan doc for the full
// verification log.
interface RawMarketRow {
  market_id: string;
  market_name: string;
  district: string;
  state: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
}

interface RawLogisticsRow {
  market_id: string;
  distance_km: number | null;
  travel_minutes: number | null;
  transport_cost: number | null;
  traffic_level: string | null;
  road_condition: string | null;
  vehicle_type: string | null;
  route_status: string | null;
}

interface RawMarketProductRow {
  id: string;
  market_id: string;
  product_id: string;
  price: number | null;
  stock_quantity: number | null;
  vendor_count: number | null;
  freshness_score: number | null;
  availability: string | null;
  updated_at: string | null;
}

interface RawProductRow {
  product_id: string;
  product_name: string;
  category: string | null;
  unit: string | null;
  description: string | null;
  image_url: string | null;
}

interface RawWeatherRow {
  district: string;
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  wind_speed: number | null;
  weather_condition: string | null;
  alert_level: string | null;
  updated_at: string | null;
}

const MARKET_COLUMNS = 'market_id,market_name,district,state,address,latitude,longitude';
const LOGISTICS_COLUMNS = 'market_id,distance_km,travel_minutes,transport_cost,traffic_level,road_condition,vehicle_type,route_status';
const MARKET_PRODUCT_COLUMNS = 'id,market_id,product_id,price,stock_quantity,vendor_count,freshness_score,availability,updated_at';
const PRODUCT_COLUMNS = 'product_id,product_name,category,unit,description,image_url';
const WEATHER_COLUMNS = 'district,temperature,humidity,rainfall,wind_speed,weather_condition,alert_level,updated_at';

/**
 * Availability strings in market_products are of unknown real-world format
 * — the table was empty at integration time, so there was nothing to
 * sample. This tries to match Supabase's raw value against the app's
 * existing badge vocabulary (case-insensitively, allowing common
 * variants), and falls back to deriving it from stock_quantity (same
 * thresholds this app already used for its own seed data) if the raw
 * string doesn't match anything recognizable. Never surfaces a raw
 * unmapped string to the UI.
 */
function normalizeAvailability(raw: string | null, stockQuantity: number): ProductAvailability {
  const normalized = (raw ?? '').trim().toLowerCase();
  const known: Record<string, ProductAvailability> = {
    'high supply': 'High Supply', 'high': 'High Supply', 'in stock': 'High Supply',
    'medium supply': 'Medium Supply', 'medium': 'Medium Supply', 'moderate': 'Medium Supply',
    'low supply': 'Low Supply', 'low': 'Low Supply', 'limited': 'Low Supply',
    'out of stock': 'Out of Stock', 'unavailable': 'Out of Stock', 'none': 'Out of Stock',
  };
  if (known[normalized]) return known[normalized];

  if (stockQuantity <= 0) return 'Out of Stock';
  if (stockQuantity < 150) return 'Low Supply';
  if (stockQuantity < 500) return 'Medium Supply';
  return 'High Supply';
}

/** Supabase only stores the numeric freshness_score, not a category — this derives the badge bucket from it. */
function freshnessFromScore(score: number): ProductFreshness {
  if (score >= 85) return 'Harvested Today';
  if (score >= 60) return 'Harvested Yesterday';
  return '2+ Days Old';
}

function toMarketLogistics(row: RawLogisticsRow | undefined): MarketLogistics {
  return {
    transportCost: row?.transport_cost ?? null,
    trafficLevel: row?.traffic_level ?? null,
    roadCondition: row?.road_condition ?? null,
    vehicleType: row?.vehicle_type ?? null,
    routeStatus: row?.route_status ?? null,
  };
}

function toMarketWeather(row: RawWeatherRow | undefined): MarketWeather | null {
  if (!row) return null;
  return {
    temperature: row.temperature,
    humidity: row.humidity,
    rainfall: row.rainfall,
    windSpeed: row.wind_speed,
    weatherCondition: row.weather_condition,
    alertLevel: row.alert_level,
    updatedAt: row.updated_at,
  };
}

function toMarketProduct(mp: RawMarketProductRow, product: RawProductRow | undefined): MarketProduct {
  const stockQuantity = mp.stock_quantity ?? 0;
  const freshnessScore = mp.freshness_score ?? 0;
  return {
    id: mp.id,
    marketId: mp.market_id,
    productId: mp.product_id,
    name: product?.product_name ?? 'Unknown product',
    category: product?.category ?? null,
    unit: product?.unit ?? 'kg',
    description: product?.description ?? null,
    imageUrl: product?.image_url ?? null,
    pricePerUnit: mp.price ?? 0,
    quantityAvailable: stockQuantity,
    freshness: freshnessFromScore(freshnessScore),
    freshnessScore,
    availability: normalizeAvailability(mp.availability, stockQuantity),
    vendorCount: mp.vendor_count ?? 0,
    lastUpdated: mp.updated_at ?? new Date(0).toISOString(),
  };
}

function aggregateAvailability(products: MarketProduct[]): ProductAvailability {
  if (products.length === 0) return 'Out of Stock';
  const counts: Record<ProductAvailability, number> = { 'High Supply': 0, 'Medium Supply': 0, 'Low Supply': 0, 'Out of Stock': 0 };
  for (const p of products) counts[p.availability] += 1;

  if (counts['High Supply'] >= products.length / 2) return 'High Supply';
  if (counts['Out of Stock'] + counts['Low Supply'] >= products.length / 2) return counts['Out of Stock'] > counts['Low Supply'] ? 'Out of Stock' : 'Low Supply';
  return 'Medium Supply';
}

async function fetchAllBaseTables() {
  const [marketsRes, logisticsRes, marketProductsRes, productsRes] = await Promise.all([
    supabase.from('markets').select(MARKET_COLUMNS),
    supabase.from('logistics').select(LOGISTICS_COLUMNS),
    supabase.from('market_products').select(MARKET_PRODUCT_COLUMNS),
    supabase.from('products').select(PRODUCT_COLUMNS),
  ]);

  for (const res of [marketsRes, logisticsRes, marketProductsRes, productsRes]) {
    if (res.error) {
      console.error('Supabase query failed:', res.error);
      throw new UpstreamError('Could not load market data right now. Please try again.');
    }
  }

  return {
    markets: (marketsRes.data ?? []) as RawMarketRow[],
    logistics: (logisticsRes.data ?? []) as RawLogisticsRow[],
    marketProducts: (marketProductsRes.data ?? []) as RawMarketProductRow[],
    products: (productsRes.data ?? []) as RawProductRow[],
  };
}

function joinProductsForMarket(
  marketId: string,
  marketProducts: RawMarketProductRow[],
  productCatalog: Map<string, RawProductRow>
): MarketProduct[] {
  return marketProducts
    .filter((mp) => mp.market_id === marketId)
    .map((mp) => toMarketProduct(mp, productCatalog.get(mp.product_id)));
}

/**
 * Powers GET /api/markets/nearby. Exactly 4 Supabase queries total,
 * regardless of how many markets/products exist — never one query per row.
 * Distance/travel-time are computed dynamically from the user's geocoded
 * search location against each market's real latitude/longitude; the
 * `logistics` table's own distance_km/travel_minutes are fixed per-market
 * (not search-relative) so they're exposed via `logistics` instead of used
 * as the primary distance metric.
 */
export async function fetchNearbyMarkets(origin: GeoPoint): Promise<NearbyMarket[]> {
  const { markets, logistics, marketProducts, products } = await fetchAllBaseTables();

  const logisticsByMarket = new Map(logistics.map((l) => [l.market_id, l]));
  const productCatalog = new Map(products.map((p) => [p.product_id, p]));

  const enriched = markets.map((market) => {
    const marketProductList = joinProductsForMarket(market.market_id, marketProducts, productCatalog);
    const distanceKm = Math.round(haversineDistanceKm(origin, { lat: market.latitude, lng: market.longitude }) * 10) / 10;
    const avgPrice = marketProductList.length > 0 ? marketProductList.reduce((s, p) => s + p.pricePerUnit, 0) / marketProductList.length : 0;
    const avgFreshness = marketProductList.length > 0 ? marketProductList.reduce((s, p) => s + p.freshnessScore, 0) / marketProductList.length : 0;
    const vendorCount = marketProductList.reduce((s, p) => s + p.vendorCount, 0);
    const lastUpdated = marketProductList.reduce((latest, p) => (p.lastUpdated > latest ? p.lastUpdated : latest), '');

    return {
      market,
      marketProductList,
      distanceKm,
      travelTimeMins: estimateTravelTimeMins(distanceKm),
      productCount: marketProductList.filter((p) => p.availability !== 'Out of Stock').length,
      vendorCount,
      availability: aggregateAvailability(marketProductList),
      avgPrice,
      avgFreshness,
      lastUpdated: lastUpdated || new Date().toISOString(),
    };
  });

  const maxDistance = Math.max(...enriched.map((e) => e.distanceKm), 1);
  const maxProducts = Math.max(...enriched.map((e) => e.productCount), 1);
  const maxAvgPrice = Math.max(...enriched.map((e) => e.avgPrice), 1);
  const maxAvgFreshness = Math.max(...enriched.map((e) => e.avgFreshness), 1);

  const scored = enriched.map((e) => {
    const distanceScore = 1 - e.distanceKm / maxDistance;
    const availabilityScore = e.productCount / maxProducts;
    const priceScore = e.avgPrice > 0 ? 1 - e.avgPrice / maxAvgPrice : 0;
    const freshnessScore = e.avgFreshness / maxAvgFreshness;
    return { ...e, score: distanceScore * 0.35 + availabilityScore * 0.25 + priceScore * 0.2 + freshnessScore * 0.2 };
  });

  const bestScore = scored.length > 0 ? Math.max(...scored.map((s) => s.score)) : 0;

  return scored
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((e) => ({
      id: e.market.market_id,
      name: e.market.market_name,
      location: [e.market.district, e.market.state].filter(Boolean).join(', '),
      district: e.market.district,
      state: e.market.state,
      geo: { lat: e.market.latitude, lng: e.market.longitude },
      distanceKm: e.distanceKm,
      travelTimeMins: e.travelTimeMins,
      productCount: e.productCount,
      vendorCount: e.vendorCount,
      availability: e.availability,
      avgPrice: Math.round(e.avgPrice),
      avgFreshness: Math.round(e.avgFreshness),
      confidenceScore: Math.round(e.score * 100),
      lastUpdated: e.lastUpdated,
      recommended: e.score === bestScore,
      logistics: toMarketLogistics(logisticsByMarket.get(e.market.market_id)),
    }));
}

/**
 * Powers GET /api/markets/:marketId/products. 4 flat queries: the market
 * row, its logistics row, its products (joined with the product catalog),
 * and weather for its district (weather is keyed by district, not
 * market_id — a real two-step dependency, still O(1) not O(N)).
 */
export async function fetchMarketDetail(marketId: string): Promise<{ products: MarketProduct[]; weather: MarketWeather | null } | null> {
  const { data: marketRows, error: marketError } = await supabase
    .from('markets')
    .select(MARKET_COLUMNS)
    .eq('market_id', marketId)
    .limit(1);

  if (marketError) {
    console.error('Supabase market lookup failed:', marketError);
    throw new UpstreamError('Could not load this market right now. Please try again.');
  }
  const market = (marketRows as RawMarketRow[] | null)?.[0];
  if (!market) return null;

  const [marketProductsRes, productsRes, weatherRes] = await Promise.all([
    supabase.from('market_products').select(MARKET_PRODUCT_COLUMNS).eq('market_id', marketId),
    supabase.from('products').select(PRODUCT_COLUMNS),
    supabase.from('weather').select(WEATHER_COLUMNS).eq('district', market.district).limit(1),
  ]);

  for (const res of [marketProductsRes, productsRes, weatherRes]) {
    if (res.error) {
      console.error('Supabase query failed:', res.error);
      throw new UpstreamError('Could not load market details right now. Please try again.');
    }
  }

  const productCatalog = new Map(((productsRes.data ?? []) as RawProductRow[]).map((p) => [p.product_id, p]));
  const products = ((marketProductsRes.data ?? []) as RawMarketProductRow[]).map((mp) => toMarketProduct(mp, productCatalog.get(mp.product_id)));
  const weather = toMarketWeather(((weatherRes.data as RawWeatherRow[] | null) ?? [])[0]);

  return { products, weather };
}

/**
 * Powers the farmer climate panel. `weather` is keyed by `district`, but a
 * farmer's location is a free-text string (manually entered or
 * reverse-geocoded, e.g. "Puducherry, Puducherry") rather than a known
 * district value — so this fetches the full (small, 6-row) weather table
 * once and matches by whichever known district name appears in the
 * location text, case-insensitively. Returns null (never a fabricated
 * fallback) when no district name is found in the string.
 */
export async function fetchWeatherByLocationText(locationText: string): Promise<MarketWeather | null> {
  const { data, error } = await supabase.from('weather').select(WEATHER_COLUMNS);
  if (error) {
    console.error('Supabase weather query failed:', error);
    throw new UpstreamError('Could not load climate data right now. Please try again.');
  }

  const rows = (data ?? []) as RawWeatherRow[];
  const normalizedLocation = locationText.toLowerCase();
  const match = rows.find((row) => normalizedLocation.includes(row.district.toLowerCase()));
  return toMarketWeather(match);
}
