
export enum CropType {
  WHEAT = 'Wheat',
  RICE = 'Rice',
  TOMATO = 'Tomato',
  POTATO = 'Potato',
  ONION = 'Onion',
  COTTON = 'Cotton',
  MAIZE = 'Maize'
}

export enum FarmerType {
  SMALL = 'Small/Marginal',
  MEDIUM = 'Medium',
  LARGE = 'Commercial/Large'
}

export type UserRole = 'farmer' | 'consumer' | null;

export interface UserInput {
  cropType: CropType;
  farmerType: FarmerType;
  harvestDate: string; 
  quantity: number; 
  quantityUnit: 'Kg' | 'Quintal' | 'Ton';
  location: string;
  storageAvailable: boolean;
  storageType?: 'Room' | 'Cold';
  storageDuration?: string;
  travelRange: number; // km
}

export interface DailyProfit {
  day: string;
  profit: number;
}

export interface PriceTrendPoint {
  day: string;
  price: number;
  msp: number;
}

export interface SpoilagePoint {
  day: string;
  riskPercentage: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D';
}

export interface WeatherData {
  temp: number;
  humidity: number;
  rain_chance: number;
  condition: string;
  storageImpact: string;
  riskMultiplier: number;
}

export interface LogisticsDetail {
  distance_km: number;
  travel_duration_mins: number;
  traffic_delay_prob: 'Low' | 'Moderate' | 'High';
  estimated_arrival: string;
  arrival_sync_status: 'On-Time' | 'Tight' | 'Late-Risk';
  transit_quality_loss: number; 
  road_type_risk: 'Low' | 'Medium' | 'High';
  alternate_route_available: boolean;
}

export interface StorageAdvisory {
  is_worth_it: boolean;
  reasoning: string;
  cooling_advised: boolean;
  max_safe_hours: number;
  stack_height_limit: string;
  ventilation_required: boolean;
  expected_grade_loss: string;
}

export interface StrategyBreakdown {
  market_justification: string;
  timing_justification: string;
  risk_mitigation_summary: string;
  delay_consequence: string;
}

export interface FallbackPlan {
  market_name: string;
  estimated_profit: number;
  profit_delta: number;
  reason_for_fallback: string;
  feasibility_score: number;
}

export interface ResilienceLayer {
  alternate_plan: FallbackPlan;
  emergency_plan: FallbackPlan;
  shock_triggers: {
    weather_alert: boolean;
    price_crash_alert: boolean;
    road_blockage_alert: boolean;
  };
}

export interface MarketEthics {
  trust_score: number; // 0-100
  fairness_rating: 'High' | 'Standard' | 'Below-Range';
  price_deviation_percent: number; // % deviation from historical/regional average
  payment_reliability_roadmap: string; 
  historical_consistency: string;
}

export interface CropStatusMonitor {
  listing_status: 'Listed' | 'Not Listed';
  current_state: 'On Track' | 'Risk' | 'Immediate Action Needed';
  safe_window_hours: number;
  expected_vs_actual_delta?: number;
}

export interface CollectiveIntelligence {
  nearby_match_count: number;
  is_opportunity_present: boolean;
  estimated_savings: number;
  cooperation_hint: string;
  privacy_status: string;
  sharing_split_details: string;
}

export interface HistoryRecord {
  id: string;
  farmerId: string;
  timestamp: number;
  input: UserInput;
  prediction: PredictionResult;
  status: 'Completed' | 'Pending' | 'Cancelled';
}

export interface PredictionResult {
  best_day: string;
  best_hour_window: string;
  best_market: string;
  expected_profit: number;
  confidence_score: number;
  urgency_level: 'Critical' | 'High' | 'Moderate' | 'Low';
  sell_now_override: boolean;
  actual_profit?: number;
  
  simple_summary: string; // LOW WORDS for common people
  
  logistics: LogisticsDetail;
  storage_advisory: StorageAdvisory; 
  strategy_breakdown: StrategyBreakdown;
  resilience_hub: ResilienceLayer;
  market_ethics: MarketEthics; 
  status_monitor: CropStatusMonitor;
  collective_intelligence: CollectiveIntelligence;
  
  current_mandi_price: number;
  last_updated_mins: number;
  price_trend_sentiment: 'Rising' | 'Falling' | 'Stable';
  historical_avg_comparison: string;
  min_safe_price: number;
  
  quality_loss_per_day: number;
  next_grade_downgrade_eta: string;
  weather: WeatherData;
  spoilage_risk: string;
  spoilage_rate: number;
  spoilage_curve: SpoilagePoint[];
  
  ai_reasoning: string;
  route_safety_score: number;
  transport_cost: number;
  alternate_market: {
    name: string;
    profit: number;
    distance: string;
  };
  profit_forecast: DailyProfit[];
  price_trend: PriceTrendPoint[];
  risk_factors: string[];
  market_trust: {
    score: number;
    fairness: string;
    paymentSpeed: string;
  };
  storage_advice: { 
    coolingRequired: boolean;
    stackHeight: string;
    humidityWarning: string;
  };
  community: {
    nearbyFarmers: number;
    potentialCost_saving: number;
    activePools: string[];
  };
  
  sdg_impact: {
    waste_reduction_kg: number;
    primary_sdg: string;
    impact_statement: string;
  };
}

export type AvailabilityStatus = 'Available' | 'Limited' | 'None';
export type FreshnessCategory = 'High' | 'Moderate' | 'Low';

export interface MarketTimingSignal {
  crop: string;
  signal: 'Rising' | 'Falling' | 'Stable';
  reason: string;
  buyRecommendation: 'Buy Now' | 'Wait' | 'Stable';
}

export interface RationalInsights {
  timingOutlook: string; 
  marketVerdict: string; 
  effortTradeOff: string; 
  confidenceScore: number;
}

export interface SmartBasketNode {
  marketName: string;
  items: string[];
  subtotal: number;
  freshnessScore: number;
}

export interface SmartBasketOptimization {
  strategy: 'Single Market' | 'Dual Market Split';
  reasoning: string;
  totalCost: number;
  totalSavingsVsRetail: number;
  avgFreshness: number;
  travelEffort: 'Minimal' | 'Moderate' | 'High';
  nodes: SmartBasketNode[];
  fallbackSingleMarket?: {
    marketName: string;
    totalCost: number;
    avgFreshness: number;
    items: string[];
  };
}

export interface MarketBalanceNudge {
  type: 'High Demand' | 'Surplus Nudge' | 'Seasonal Peak';
  crop: string;
  message: string;
  impactLevel: 'Low' | 'Moderate' | 'Significant';
}

export interface ConsumerAlert {
  id: string;
  type: 'price' | 'freshness' | 'distance';
  message: string;
  actionHint: string;
}

export interface ConsumerPrediction {
  recommendedCrops: {
    crop: string;
    farmerPrice: number;
    retailPrice: number;
    trend: 'down' | 'up';
    freshnessScore: number;
    freshnessCategory: FreshnessCategory;
    harvestRecency: string; 
    transportImpact: string;
    demandLevel: string;
    effectiveValueScore: number;
    bestMarketName: string; 
  }[];
  nearbyMarkets: {
    name: string;
    distance: string;
    distance_km: number;
    specialty: string;
    meiScore: number;
    trustScore: number;
    isOpen: boolean;
    availabilitySignal: AvailabilityStatus;
    lastSupplyUpdate: string;
  }[];
  smartBasket: SmartBasketOptimization;
  marketTiming: MarketTimingSignal[];
  marketBalance: MarketBalanceNudge[];
  alerts: ConsumerAlert[];
  freshAndAffordable?: {
    crop: string;
    marketName: string;
    price: number;
    reason: string;
  };
  rationalInsights: RationalInsights;
  aiAdvice: string;
  simple_advice: string; // LOW WORDS for common shoppers
  regionalSupplyStrength: number; 
}

export interface FarmerProfile {
  uid: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  createdAt: string;
}

export interface MarketStall {
  id: string;
  marketId: string;
  number: string;
  type: string;
  size: string;
  pricePerDay: number;
  status: 'available' | 'booked' | 'maintenance';
  bookedBy: string | null;
  slotTime: {
    start: string;
    end: string;
  };
}

export interface StallBooking {
  id: string;
  farmerId: string;
  marketId: string;
  stallId: string;
  bookingDate: string;
  slotTime: {
    start: string;
    end: string;
  };
  status: 'confirmed' | 'cancelled' | 'completed';
  cropType: string;
  quantity: number;
  totalFee: number;
  createdAt: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MarketNode {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentOccupancy?: number;
  geo: GeoPoint;
  operatingHours: {
    open: string;
    close: string;
  };
}

export type ProductAvailability = 'High Supply' | 'Medium Supply' | 'Low Supply' | 'Out of Stock';
export type ProductFreshness = 'Harvested Today' | 'Harvested Yesterday' | '2+ Days Old';

// --- Consumer Market Discovery: backed by Supabase (server/services/marketService.ts) ---
// Deliberately NOT related to MarketNode above, which is the farmer-side
// stall-booking domain (its own in-memory data, its own id space) — these
// are two disconnected systems now that Market Discovery reads from a real
// external database with its own market_id/product_id values.

export interface MarketLogistics {
  transportCost: number | null;
  trafficLevel: string | null;
  roadCondition: string | null;
  vehicleType: string | null;
  routeStatus: string | null;
}

export interface MarketWeather {
  temperature: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
  weatherCondition: string | null;
  alertLevel: string | null;
  updatedAt: string | null;
  source?: string;
  status?: string;
  fetchedAt?: string;
}

export interface MarketProduct {
  id: string; // market_products.id — the listing's own row, not the product catalog id
  marketId: string;
  productId: string;
  name: string; // products.product_name
  category: string | null;
  unit: string;
  description: string | null;
  imageUrl: string | null;
  pricePerUnit: number;
  quantityAvailable: number;
  freshness: ProductFreshness; // derived from freshnessScore — Supabase only stores the numeric score
  freshnessScore: number; // 0-100, real column: market_products.freshness_score
  availability: ProductAvailability;
  vendorCount: number;
  lastUpdated: string; // ISO timestamp, real column: market_products.updated_at
}

export interface NearbyMarket {
  id: string; // markets.market_id
  name: string; // markets.market_name
  location: string; // derived display string: "district, state" — no unified location column exists
  district: string;
  state: string | null;
  geo: GeoPoint;
  distanceKm: number;
  travelTimeMins: number;
  productCount: number;
  vendorCount: number;
  availability: ProductAvailability;
  avgPrice: number;
  avgFreshness: number; // 0-100, mean of this market's product freshnessScores
  confidenceScore: number; // 0-100, the same real ranking score used to pick `recommended`
  lastUpdated: string; // ISO timestamp
  recommended: boolean;
  logistics: MarketLogistics;
}

// --- Farmer Market Analysis: multi-product, Supabase-grounded, deterministic ---
// Deliberately replaces the old single-crop UserInput/PredictionResult (Gemini-
// fabricated, no DB backing) for the farmer flow. Every field here traces to a
// real Supabase column or is explicitly nullable/labelled "unavailable" —
// nothing here is invented client-side.

export interface ProductSummary {
  productId: string;
  productName: string;
  category: string | null;
  unit: string;
}

export type HarvestStatus = 'ready' | 'harvested' | 'expected';
export type TransportPreference = 'own' | 'shared' | 'need' | 'undecided';
export type PriceTrendDirection = 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
export type StorageRiskLevel = 'low' | 'moderate' | 'high' | 'unavailable';

export interface FarmerProductSelection {
  productId: string; // products.product_id
  productName: string;
  category: string | null;
  unit: string;
  quantity: number;
  harvestStatus: HarvestStatus;
  harvestDate?: string;
  availableQuantity: number;
}

// UI-only state — no vehicle/mileage columns exist anywhere in the schema, so
// this is never sent into a cost calculation, only collected for the farmer's
// own reference.
export interface OwnVehicleInfo {
  vehicleType?: string;
  fuelType?: string;
  mileage?: number;
  capacity?: number;
}

export interface MarketAnalysisInput {
  products: FarmerProductSelection[];
  location: string;
  transportPreference: TransportPreference;
  ownVehicle?: OwnVehicleInfo;
}

export interface PriceInsight {
  productId: string;
  currentPrice: number | null; // most recent price_history row for this listing
  sevenDayAvg: number | null; // null when fewer than MIN_TREND_POINTS rows exist
  trend: PriceTrendDirection;
  dataPoints: number;
}

export interface StorageRisk {
  productId: string;
  productName: string;
  level: StorageRiskLevel;
  reason: string;
  storageType: string | null;
  maxStorageDays: number | null;
  idealTemperature: number | null;
  humidityRange: string | null;
  recommendation: string | null;
}

export interface FarmerTransportPoolEntry {
  poolId: string;
  marketId: string;
  vehicleType: string | null;
  status: string | null;
  updatedAt: string | null;
}

export interface MarketProductOffer {
  productId: string;
  productName: string;
  unit: string;
  quantityRequested: number;
  price: number | null; // market_products.price — null if this market doesn't carry it
  availability: ProductAvailability | null;
  freshnessScore: number | null;
  saleValue: number | null; // quantity * price, null when price is null
}

export interface MarketCostBreakdown {
  saleValue: number | null; // sum of known per-product saleValue; null if zero products priced
  unpricedProductNames: string[]; // products this market carries no price for
  transportCost: number | null; // logistics.transport_cost — reference figure, not a personalized quote
  storageCost: null; // no cost column exists anywhere — always null/"Not available"
  otherCosts: null; // no other known cost source — always null/"Not available"
  netReturn: number | null; // saleValue - transportCost, only when saleValue is known
}

export interface MarketScoreBreakdown {
  netReturn: number;
  priceTrend: number;
  transportCost: number;
  distance: number;
  storageRisk: number;
  productAvailability: number;
}

export interface MarketRecommendation {
  marketId: string;
  marketName: string;
  district: string;
  state: string | null;
  geo: GeoPoint;
  distanceKm: number;
  travelTimeMins: number;
  logistics: MarketLogistics;
  offers: MarketProductOffer[]; // one per requested product this market carries
  priceInsights: PriceInsight[];
  storageRisks: StorageRisk[];
  transportPool: FarmerTransportPoolEntry[];
  costBreakdown: MarketCostBreakdown;
  score: number; // 0-100, "Recommendation Score"
  scoreBreakdown: MarketScoreBreakdown;
  whyBullets: string[]; // deterministic, code-generated from scoreBreakdown/costBreakdown
  explanation?: string; // optional Gemini prose over the verified facts above; omitted on failure
  metadata?: {
    weather: { source: string; status: string; fetchedAt: string };
    route: { source: string; status: string; fetchedAt: string };
    price: { source: string; status: string; fetchedAt: string };
    transportCost: { source: string; status: string; fetchedAt: string };
  };
}

export interface SavedAnalysis {
  id: string;
  farmerId: string;
  timestamp: number;
  input: MarketAnalysisInput;
  topMarketName: string;
  topScore: number;
  status: 'Saved';
}
