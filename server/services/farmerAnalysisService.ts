import { supabase } from './supabaseClient.ts';
import { forwardGeocode } from './geocodingService.ts';
import { getStorageAdvisories, computeStorageRisk } from './storageRiskService.ts';
import { getPriceInsights } from './priceService.ts';
import { getTransportPoolsByMarket } from './transportService.ts';
import { fetchLiveWeather } from './weatherService.ts';
import { getLiveRoute } from './routeService.ts';
import { calculateEstimatedTransportCost } from './transportCostService.ts';
import { calculateRecommendationScore } from './recommendationService.ts';
import { UpstreamError } from '../domain/errors.ts';
import type {
  MarketAnalysisInput,
  MarketRecommendation,
  MarketProductOffer,
  MarketCostBreakdown,
  MarketLogistics,
  MarketWeather,
  PriceInsight,
  ProductAvailability,
} from '../../shared/types.ts';

export { SCORE_WEIGHTS } from '../config/recommendationWeights.ts';

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

const MARKET_COLUMNS = 'market_id,market_name,district,state,latitude,longitude';
const LOGISTICS_COLUMNS = 'market_id,distance_km,travel_minutes,transport_cost,traffic_level,road_condition,vehicle_type,route_status';
const MARKET_PRODUCT_COLUMNS = 'id,market_id,product_id,price,stock_quantity,vendor_count,freshness_score,availability';

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

function toMarketLogistics(
  row: RawLogisticsRow | undefined,
  routeSource?: string,
  routeStatus?: string
): MarketLogistics {
  return {
    transportCost: row?.transport_cost ?? null,
    trafficLevel: row?.traffic_level ?? null,
    roadCondition: row?.road_condition ?? null,
    vehicleType: row?.vehicle_type ?? null,
    routeStatus: routeStatus || row?.route_status || null,
  };
}

function priceTrendPoints(trend: PriceInsight['trend']): number {
  if (trend === 'increasing') return 1;
  if (trend === 'stable') return 0.5;
  if (trend === 'decreasing') return 0;
  return 0.5; // neutral
}

function storageRiskPoints(level: 'low' | 'moderate' | 'high' | 'unavailable'): number {
  if (level === 'low') return 1;
  if (level === 'moderate') return 0.5;
  if (level === 'high') return 0;
  return 0.5; // neutral
}

export async function analyzeMarkets(input: MarketAnalysisInput, topN = DEFAULT_TOP_N): Promise<MarketRecommendation[]> {
  const origin = await forwardGeocode(input.location);
  const productIds = input.products.map((p) => p.productId);

  const [marketsRes, logisticsRes, marketProductsRes, storageAdvisories] = await Promise.all([
    supabase.from('markets').select(MARKET_COLUMNS),
    supabase.from('logistics').select(LOGISTICS_COLUMNS),
    supabase.from('market_products').select(MARKET_PRODUCT_COLUMNS).in('product_id', productIds),
    getStorageAdvisories(productIds),
  ]);

  for (const res of [marketsRes, logisticsRes, marketProductsRes]) {
    if (res.error) {
      console.error('Supabase query failed during market analysis:', res.error);
      throw new UpstreamError('Could not load market data right now. Please try again.');
    }
  }

  const markets = (marketsRes.data ?? []) as RawMarketRow[];
  const logisticsByMarket = new Map(((logisticsRes.data ?? []) as RawLogisticsRow[]).map((l) => [l.market_id, l]));
  const marketProducts = (marketProductsRes.data ?? []) as RawMarketProductRow[];

  const marketProductsByMarket = new Map<string, RawMarketProductRow[]>();
  for (const mp of marketProducts) {
    const list = marketProductsByMarket.get(mp.market_id) ?? [];
    list.push(mp);
    marketProductsByMarket.set(mp.market_id, list);
  }

  // Candidate markets carrying at least one product
  const candidateMarkets = markets.filter((m) => (marketProductsByMarket.get(m.market_id)?.length ?? 0) > 0);

  const relevantMarketProductIds = marketProducts.map((mp) => mp.id);
  const [priceInsightsByListing, transportPoolByMarket] = await Promise.all([
    getPriceInsights(relevantMarketProductIds),
    getTransportPoolsByMarket(),
  ]);

  // Fetch routes and weather details for all candidate markets in parallel
  const [routes, weatherDataPoints] = await Promise.all([
    Promise.all(candidateMarkets.map((m) => getLiveRoute(origin, { lat: m.latitude, lng: m.longitude }))),
    Promise.all(candidateMarkets.map((m) => fetchLiveWeather(m.latitude, m.longitude, m.district))),
  ]);

  const routeByMarketId = new Map(candidateMarkets.map((m, idx) => [m.market_id, routes[idx]]));
  const weatherByMarketId = new Map(candidateMarkets.map((m, idx) => [m.market_id, weatherDataPoints[idx]]));
  const productNameById = new Map(input.products.map((p) => [p.productId, p]));

  const enriched = candidateMarkets.map((market) => {
    const listings = marketProductsByMarket.get(market.market_id) ?? [];
    const routeInfo = routeByMarketId.get(market.market_id)!;
    const weatherInfo = weatherByMarketId.get(market.market_id)!;

    const distanceKm = routeInfo.distanceKm;
    const travelTimeMins = routeInfo.durationMinutes;

    const weather: MarketWeather = {
      temperature: weatherInfo.temperature,
      humidity: weatherInfo.humidity,
      rainfall: weatherInfo.rainfall,
      windSpeed: weatherInfo.windSpeed,
      weatherCondition: weatherInfo.weatherCondition,
      alertLevel: weatherInfo.alertLevel,
      updatedAt: weatherInfo.updatedAt,
    };

    const logisticsRow = logisticsByMarket.get(market.market_id);

    const offers: MarketProductOffer[] = [];
    const priceInsights: PriceInsight[] = [];
    const storageRisks = [];
    let saleValue = 0;
    let pricedCount = 0;
    const matchedProductIds = new Set<string>();

    for (const listing of listings) {
      const selection = productNameById.get(listing.product_id);
      if (!selection) continue;
      matchedProductIds.add(listing.product_id);

      const price = listing.price ?? null;
      const saleValueForProduct = price != null ? price * selection.quantity : null;
      if (saleValueForProduct != null) {
        saleValue += saleValueForProduct;
        pricedCount += 1;
      }

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

    // Determine unpriced/unavailable products at this market
    const unpricedProductNames: string[] = [];
    for (const selection of input.products) {
      if (!matchedProductIds.has(selection.productId)) {
        unpricedProductNames.push(selection.productName);
      } else {
        const offer = offers.find(o => o.productId === selection.productId);
        if (offer && offer.price === null) {
          unpricedProductNames.push(selection.productName);
        }
      }
    }

    // Calculate transport cost using transportCostService
    const transportCostInfo = calculateEstimatedTransportCost(
      distanceKm,
      input.ownVehicle?.vehicleType,
      input.ownVehicle?.fuelType
    );
    const transportCost = transportCostInfo.cost;
    const netReturn = pricedCount > 0 ? saleValue - transportCost : null;

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
      travelTimeMins,
      logistics: toMarketLogistics(logisticsRow, routeInfo.source, routeInfo.status),
      offers,
      priceInsights,
      storageRisks,
      transportPool: transportPoolByMarket.get(market.market_id) ?? [],
      costBreakdown,
      productAvailabilityRatio: offers.length / input.products.length,
      avgPriceTrendPoints: priceInsights.length > 0 ? priceInsights.reduce((s, p) => s + priceTrendPoints(p.trend), 0) / priceInsights.length : 0.5,
      avgStorageRiskPoints: storageRisks.length > 0 ? storageRisks.reduce((s, r) => s + storageRiskPoints(r.level), 0) / storageRisks.length : 0.5,
      // Metadata sources
      metadata: {
        weather: {
          source: weatherInfo.source,
          status: weatherInfo.status,
          fetchedAt: weatherInfo.updatedAt || new Date().toISOString(),
        },
        route: {
          source: routeInfo.source,
          status: routeInfo.status,
          fetchedAt: routeInfo.fetchedAt,
        },
        price: {
          source: 'Supabase Price Database',
          status: 'database',
          fetchedAt: new Date().toISOString(),
        },
        transportCost: {
          source: 'Transport Configuration Service',
          status: 'calculated_estimate',
          fetchedAt: new Date().toISOString(),
        }
      }
    };
  });

  const maxDistance = Math.max(...enriched.map((e) => e.distanceKm), 1);
  const maxNetReturn = Math.max(...enriched.map((e) => e.costBreakdown.netReturn ?? 0), 1);
  const maxTransportCost = Math.max(...enriched.map((e) => e.costBreakdown.transportCost ?? 0), 1);

  const scored = enriched.map((e) => {
    const netReturnScore = Math.max(0, (e.costBreakdown.netReturn ?? 0) / maxNetReturn);
    const distanceScore = 1 - e.distanceKm / maxDistance;
    const transportCostScore = e.costBreakdown.transportCost != null ? 1 - e.costBreakdown.transportCost / maxTransportCost : 0.5;
    const priceTrendScore = e.avgPriceTrendPoints;
    const storageRiskScore = e.avgStorageRiskPoints;
    const productAvailabilityScore = e.productAvailabilityRatio;

    // Delegate calculation of recommendation scores to the new recommendationService
    const ranking = calculateRecommendationScore(
      netReturnScore,
      priceTrendScore,
      transportCostScore,
      distanceScore,
      storageRiskScore,
      productAvailabilityScore
    );

    const whyBullets: string[] = [];
    if (ranking.scoreBreakdown.netReturn >= 70) whyBullets.push('Higher estimated net return than other nearby markets.');
    if (ranking.scoreBreakdown.priceTrend >= 70) whyBullets.push('Prices for your products have been trending upward here.');
    if (ranking.scoreBreakdown.transportCost >= 70) whyBullets.push('Lower transport cost than other nearby markets.');
    if (ranking.scoreBreakdown.distance >= 70) whyBullets.push('Closer to your farm than other suitable markets.');
    if (ranking.scoreBreakdown.storageRisk >= 70) whyBullets.push('Lower storage risk under current conditions.');
    if (ranking.scoreBreakdown.productAvailability === 100) whyBullets.push('Carries all of your selected products.');
    if (whyBullets.length === 0) whyBullets.push('A reasonable balance of price, distance, and transport cost among the available options.');

    return { ...e, score: ranking.score, scoreBreakdown: ranking.scoreBreakdown, whyBullets };
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
      // Pass the metadata along to the recommendation
      metadata: e.metadata,
    } as any)); // cast dynamically to allow metadata property
}
