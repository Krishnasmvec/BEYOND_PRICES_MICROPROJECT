import { supabase } from './supabaseClient.ts';
import { forwardGeocode, haversineDistanceKm, estimateTravelTimeMins } from './geocodingService.ts';
import { getStorageAdvisories, computeStorageRisk } from './storageRiskService.ts';
import { getPriceInsights } from './priceService.ts';
import { getTransportPoolsByMarket } from './transportService.ts';
import { UpstreamError } from '../domain/errors.ts';
import type {
  MarketAnalysisInput,
  MarketRecommendation,
  MarketProductOffer,
  MarketCostBreakdown,
  MarketScoreBreakdown,
  MarketLogistics,
  MarketWeather,
  PriceInsight,
  ProductAvailability,
} from '../../types.ts';

// Raw row shapes verified column-by-column against the live Supabase
// project during STEP 10 — same rigor, and the same real schema, as
// marketService.ts (this file intentionally keeps its own copies of these
// constants rather than importing marketService's, since those are
// module-private there; duplicating a short column-list string is cheaper
// and safer than exporting internals across services).
interface RawMarketRow {
  market_id: string;
  market_name: string;
  district: string;
  state: string | null;
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

const MARKET_COLUMNS = 'market_id,market_name,district,state,latitude,longitude';
const LOGISTICS_COLUMNS = 'market_id,distance_km,travel_minutes,transport_cost,traffic_level,road_condition,vehicle_type,route_status';
const MARKET_PRODUCT_COLUMNS = 'id,market_id,product_id,price,stock_quantity,vendor_count,freshness_score,availability';
const WEATHER_COLUMNS = 'district,temperature,humidity,rainfall,wind_speed,weather_condition,alert_level,updated_at';

// Configurable, named, and documented per the task's requirement that the
// weighting not be buried inline. Sums to 1; adjust here only.
export const SCORE_WEIGHTS = {
  netReturn: 0.35,
  priceTrend: 0.15,
  transportCost: 0.15,
  distance: 0.15,
  storageRisk: 0.1,
  productAvailability: 0.1,
};

const DEFAULT_TOP_N = 3;

function normalizeAvailability(raw: string | null, stockQuantity: number): ProductAvailability {
  const normalized = (raw ?? '').trim().toLowerCase();
  const known: Record<string, ProductAvailability> = {
    'high supply': 'High Supply', high: 'High Supply', 'in stock': 'High Supply',
    'medium supply': 'Medium Supply', medium: 'Medium Supply', moderate: 'Medium Supply',
    'low supply': 'Low Supply', low: 'Low Supply', limited: 'Low Supply',
    'out of stock': 'Out of Stock', unavailable: 'Out of Stock', none: 'Out of Stock',
  };
  if (known[normalized]) return known[normalized];
  if (stockQuantity <= 0) return 'Out of Stock';
  if (stockQuantity < 150) return 'Low Supply';
  if (stockQuantity < 500) return 'Medium Supply';
  return 'High Supply';
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

function priceTrendPoints(trend: PriceInsight['trend']): number {
  if (trend === 'increasing') return 1;
  if (trend === 'stable') return 0.5;
  if (trend === 'decreasing') return 0;
  return 0.5; // insufficient_data — neutral, never penalized for missing history
}

function storageRiskPoints(level: 'low' | 'moderate' | 'high' | 'unavailable'): number {
  if (level === 'low') return 1;
  if (level === 'moderate') return 0.5;
  if (level === 'high') return 0;
  return 0.5; // unavailable — neutral
}

/**
 * Powers POST /api/farmer/analysis. Query plan: 1 geocode call, then phase 1
 * (5 flat Supabase queries in parallel: markets, logistics, market_products
 * filtered to the selected product ids, weather, storage_advisory filtered
 * to the selected ids), then phase 2 (2 flat queries in parallel, using ids
 * resolved from phase 1: price_history filtered to the resolved
 * market_product ids, transport_pool). 7 Supabase queries total regardless
 * of catalog size or candidate market count — never one query per market.
 */
export async function analyzeMarkets(input: MarketAnalysisInput, topN = DEFAULT_TOP_N): Promise<MarketRecommendation[]> {
  const origin = await forwardGeocode(input.location);
  const productIds = input.products.map((p) => p.productId);

  const [marketsRes, logisticsRes, marketProductsRes, weatherRes, storageAdvisories] = await Promise.all([
    supabase.from('markets').select(MARKET_COLUMNS),
    supabase.from('logistics').select(LOGISTICS_COLUMNS),
    supabase.from('market_products').select(MARKET_PRODUCT_COLUMNS).in('product_id', productIds),
    supabase.from('weather').select(WEATHER_COLUMNS),
    getStorageAdvisories(productIds),
  ]);

  for (const res of [marketsRes, logisticsRes, marketProductsRes, weatherRes]) {
    if (res.error) {
      console.error('Supabase query failed during market analysis:', res.error);
      throw new UpstreamError('Could not load market data right now. Please try again.');
    }
  }

  const markets = (marketsRes.data ?? []) as RawMarketRow[];
  const logisticsByMarket = new Map(((logisticsRes.data ?? []) as RawLogisticsRow[]).map((l) => [l.market_id, l]));
  const weatherByDistrict = new Map(((weatherRes.data ?? []) as RawWeatherRow[]).map((w) => [w.district, w]));
  const marketProducts = (marketProductsRes.data ?? []) as RawMarketProductRow[];

  const marketProductsByMarket = new Map<string, RawMarketProductRow[]>();
  for (const mp of marketProducts) {
    const list = marketProductsByMarket.get(mp.market_id) ?? [];
    list.push(mp);
    marketProductsByMarket.set(mp.market_id, list);
  }

  // Only candidate markets that carry at least one requested product —
  // markets with zero matches are excluded from ranking, not scored 0.
  const candidateMarkets = markets.filter((m) => (marketProductsByMarket.get(m.market_id)?.length ?? 0) > 0);

  const relevantMarketProductIds = marketProducts.map((mp) => mp.id);
  const [priceInsightsByListing, transportPoolByMarket] = await Promise.all([
    getPriceInsights(relevantMarketProductIds),
    getTransportPoolsByMarket(),
  ]);

  const productNameById = new Map(input.products.map((p) => [p.productId, p]));

  const enriched = candidateMarkets.map((market) => {
    const listings = marketProductsByMarket.get(market.market_id) ?? [];
    const distanceKm = Math.round(haversineDistanceKm(origin, { lat: market.latitude, lng: market.longitude }) * 10) / 10;
    const weather = toMarketWeather(weatherByDistrict.get(market.district));
    const logisticsRow = logisticsByMarket.get(market.market_id);

    const offers: MarketProductOffer[] = [];
    const priceInsights: PriceInsight[] = [];
    const storageRisks = [];
    let saleValue = 0;
    let pricedCount = 0;
    const unpricedProductNames: string[] = [];

    for (const listing of listings) {
      const selection = productNameById.get(listing.product_id);
      if (!selection) continue;
      const price = listing.price ?? null;
      const saleValueForProduct = price != null ? price * selection.quantity : null;
      if (saleValueForProduct != null) { saleValue += saleValueForProduct; pricedCount += 1; }
      else unpricedProductNames.push(selection.productName);

      offers.push({
        productId: listing.product_id,
        productName: selection.productName,
        unit: selection.unit,
        quantityRequested: selection.quantity,
        price,
        availability: normalizeAvailability(listing.availability, listing.stock_quantity ?? 0),
        freshnessScore: listing.freshness_score ?? null,
        saleValue: saleValueForProduct,
      });

      const insight = priceInsightsByListing.get(listing.id);
      priceInsights.push({
        productId: listing.product_id,
        currentPrice: insight?.currentPrice ?? price,
        sevenDayAvg: insight?.sevenDayAvg ?? null,
        trend: insight?.trend ?? 'insufficient_data',
        dataPoints: insight?.dataPoints ?? 0,
      });

      storageRisks.push(computeStorageRisk(listing.product_id, selection.productName, storageAdvisories.get(listing.product_id), weather));
    }

    const transportCost = logisticsRow?.transport_cost ?? null;
    const netReturn = pricedCount > 0 ? saleValue - (transportCost ?? 0) : null;

    const costBreakdown: MarketCostBreakdown = {
      saleValue: pricedCount > 0 ? Math.round(saleValue * 100) / 100 : null,
      unpricedProductNames,
      transportCost,
      storageCost: null,
      otherCosts: null,
      netReturn: netReturn != null ? Math.round(netReturn * 100) / 100 : null,
    };

    return {
      market,
      distanceKm,
      travelTimeMins: estimateTravelTimeMins(distanceKm),
      logistics: toMarketLogistics(logisticsRow),
      offers,
      priceInsights,
      storageRisks,
      transportPool: transportPoolByMarket.get(market.market_id) ?? [],
      costBreakdown,
      productAvailabilityRatio: offers.length / input.products.length,
      avgPriceTrendPoints: priceInsights.length > 0 ? priceInsights.reduce((s, p) => s + priceTrendPoints(p.trend), 0) / priceInsights.length : 0.5,
      avgStorageRiskPoints: storageRisks.length > 0 ? storageRisks.reduce((s, r) => s + storageRiskPoints(r.level), 0) / storageRisks.length : 0.5,
    };
  });

  const maxDistance = Math.max(...enriched.map((e) => e.distanceKm), 1);
  const maxNetReturn = Math.max(...enriched.map((e) => e.costBreakdown.netReturn ?? 0), 1);
  const maxTransportCost = Math.max(...enriched.map((e) => e.logistics.transportCost ?? 0), 1);

  const scored = enriched.map((e) => {
    const netReturnScore = Math.max(0, (e.costBreakdown.netReturn ?? 0) / maxNetReturn);
    const distanceScore = 1 - e.distanceKm / maxDistance;
    const transportCostScore = e.logistics.transportCost != null ? 1 - e.logistics.transportCost / maxTransportCost : 0.5;
    const priceTrendScore = e.avgPriceTrendPoints;
    const storageRiskScore = e.avgStorageRiskPoints;
    const productAvailabilityScore = e.productAvailabilityRatio;

    const scoreBreakdown: MarketScoreBreakdown = {
      netReturn: Math.round(netReturnScore * 100),
      priceTrend: Math.round(priceTrendScore * 100),
      transportCost: Math.round(transportCostScore * 100),
      distance: Math.round(distanceScore * 100),
      storageRisk: Math.round(storageRiskScore * 100),
      productAvailability: Math.round(productAvailabilityScore * 100),
    };

    const score =
      netReturnScore * SCORE_WEIGHTS.netReturn +
      priceTrendScore * SCORE_WEIGHTS.priceTrend +
      transportCostScore * SCORE_WEIGHTS.transportCost +
      distanceScore * SCORE_WEIGHTS.distance +
      storageRiskScore * SCORE_WEIGHTS.storageRisk +
      productAvailabilityScore * SCORE_WEIGHTS.productAvailability;

    const whyBullets: string[] = [];
    if (scoreBreakdown.netReturn >= 70) whyBullets.push('Higher estimated net return than other nearby markets.');
    if (scoreBreakdown.priceTrend >= 70) whyBullets.push('Prices for your products have been trending upward here.');
    if (scoreBreakdown.transportCost >= 70) whyBullets.push('Lower transport cost than other nearby markets.');
    if (scoreBreakdown.distance >= 70) whyBullets.push('Closer to your farm than other suitable markets.');
    if (scoreBreakdown.storageRisk >= 70) whyBullets.push('Lower storage risk under current conditions.');
    if (scoreBreakdown.productAvailability === 100) whyBullets.push('Carries all of your selected products.');
    if (whyBullets.length === 0) whyBullets.push('A reasonable balance of price, distance, and transport cost among the available options.');

    return { ...e, score: Math.round(score * 100), scoreBreakdown, whyBullets };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((e): MarketRecommendation => ({
      marketId: e.market.market_id,
      marketName: e.market.market_name,
      district: e.market.district,
      state: e.market.state,
      geo: { lat: e.market.latitude, lng: e.market.longitude },
      distanceKm: e.distanceKm,
      travelTimeMins: e.travelTimeMins,
      logistics: e.logistics,
      offers: e.offers,
      priceInsights: e.priceInsights,
      storageRisks: e.storageRisks,
      transportPool: e.transportPool,
      costBreakdown: e.costBreakdown,
      score: e.score,
      scoreBreakdown: e.scoreBreakdown,
      whyBullets: e.whyBullets,
    }));
}
