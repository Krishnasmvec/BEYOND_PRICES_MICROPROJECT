import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, X, CheckCircle } from 'lucide-react';
import ProductSelector from './ProductSelector';
import ProductionDetailsForm from './ProductionDetailsForm';
import FarmLocationStep from './FarmLocationStep';
import TransportPreferenceStep from './TransportPreferenceStep';
import ClimateSummaryPanel from './ClimateSummaryPanel';
import AnalysisLoadingScreen from './AnalysisLoadingScreen';
import TopMarketsList from './TopMarketsList';
import MarketRecommendationDetail from './MarketRecommendationDetail';
import RouteSection from './RouteSection';
import FarmerActionsBar from './FarmerActionsBar';
import StallBookingFlow from '../StallBookingFlow';
import { analyzeMarkets } from '../../lib/api';
import type {
  FarmerProductSelection,
  TransportPreference,
  OwnVehicleInfo,
  MarketAnalysisInput,
  MarketRecommendation,
} from '../../types';

interface MarketAnalysisWizardProps {
  onBack: () => void;
}

type WizardStep = 'products' | 'details' | 'location' | 'transport' | 'review' | 'results';

const STEP_ORDER: WizardStep[] = ['products', 'details', 'location', 'transport', 'review', 'results'];

const STEP_META: Record<WizardStep, { label: string; title: string; subtitle: string }> = {
  products: {
    label: 'Products',
    title: 'Select Your Products',
    subtitle: 'Search the full catalog and add everything you want to sell.',
  },
  details: {
    label: 'Details',
    title: 'Production Details',
    subtitle: 'Enter harvest status, dates, and available quantities.',
  },
  location: {
    label: 'Location',
    title: 'Farm Location',
    subtitle: 'Tell us where your farm is to calculate distances to markets.',
  },
  transport: {
    label: 'Transport',
    title: 'Transport Preference',
    subtitle: 'How do you plan to move your produce to the market?',
  },
  review: {
    label: 'Review',
    title: 'Review & Analyze',
    subtitle: 'Check your inputs, then run the market analysis.',
  },
  results: {
    label: 'Results',
    title: 'Market Recommendations',
    subtitle: 'Top 3 markets ranked by estimated return, price, distance, and storage risk.',
  },
};

const MarketAnalysisWizard: React.FC<MarketAnalysisWizardProps> = ({ onBack }) => {
  // ── Wizard state ───────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('products');
  const [products, setProducts] = useState<FarmerProductSelection[]>([]);
  const [location, setLocation] = useState('');
  const [transportPreference, setTransportPreference] = useState<TransportPreference>('undecided');
  const [ownVehicle, setOwnVehicle] = useState<OwnVehicleInfo>({});

  // ── Analysis state ─────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MarketRecommendation[]>([]);
  const [selectedRec, setSelectedRec] = useState<MarketRecommendation | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'list' | 'detail' | 'route'>('list');

  // ── Booking ────────────────────────────────────────────────
  const [bookingOpen, setBookingOpen] = useState(false);

  const currentIdx = STEP_ORDER.indexOf(step);

  // ── Validation ─────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (step === 'products') return products.length > 0;
    if (step === 'details') return products.every((p) => p.quantity > 0);
    if (step === 'location') return location.trim().length > 0;
    if (step === 'transport') return true;
    if (step === 'review') return true;
    return true;
  };

  const next = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEP_ORDER.length) setStep(STEP_ORDER[nextIdx]);
  };

  const prev = () => {
    if (step === 'results') { setStep('review'); return; }
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEP_ORDER[prevIdx]);
  };

  // ── Run analysis ───────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecommendations([]);
    setSelectedRec(null);
    setActiveResultTab('list');

    const input: MarketAnalysisInput = {
      products,
      location,
      transportPreference,
      ownVehicle: transportPreference === 'own' ? ownVehicle : undefined,
    };

    try {
      const recs = await analyzeMarkets(input);
      setRecommendations(recs);
      if (recs.length > 0) setSelectedRec(recs[0]);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Market analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [products, location, transportPreference, ownVehicle]);

  const analysisInput: MarketAnalysisInput = {
    products, location, transportPreference,
    ownVehicle: transportPreference === 'own' ? ownVehicle : undefined,
  };

  // ── Render step content ────────────────────────────────────
  const renderStepContent = () => {
    switch (step) {
      case 'products':
        return <ProductSelector selected={products} onChange={setProducts} />;

      case 'details':
        return <ProductionDetailsForm products={products} onChange={setProducts} />;

      case 'location':
        return <FarmLocationStep location={location} onChange={setLocation} />;

      case 'transport':
        return (
          <TransportPreferenceStep
            preference={transportPreference}
            ownVehicle={ownVehicle}
            onPreferenceChange={setTransportPreference}
            onVehicleChange={setOwnVehicle}
          />
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Products */}
                <ReviewSection label="Products">
                  <div className="space-y-3 mt-2">
                    {products.map((p) => (
                      <div key={p.productId} className="flex items-center justify-between pb-3 border-b border-neutral-100 last:border-0 last:pb-0">
                        <span className="text-sm font-bold text-neutral-800">{p.productName}</span>
                        <span className="text-sm font-medium text-neutral-500 bg-neutral-50 px-2 py-1 rounded">{p.quantity} {p.unit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-neutral-400">{products.length} product{products.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs font-bold text-agri-700 bg-agri-50 px-2 py-1 rounded">Total: {products.reduce((s, p) => s + p.quantity, 0).toLocaleString('en-IN')} units</span>
                  </div>
                </ReviewSection>

                {/* Location & Transport */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ReviewSection label="Farm location">
                    <p className="text-sm font-bold text-neutral-800 mt-2">{location}</p>
                  </ReviewSection>
                  <ReviewSection label="Transport">
                    <p className="text-sm font-bold text-neutral-800 mt-2 capitalize">{transportPreference.replace('_', ' ')}</p>
                    {transportPreference === 'own' && ownVehicle.vehicleType && (
                      <p className="text-xs font-medium text-neutral-500 mt-1">{ownVehicle.vehicleType}</p>
                    )}
                  </ReviewSection>
                </div>
              </div>

              {/* Climate preview */}
              {location && (
                <div>
                  <ClimateSummaryPanel location={location} />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm font-medium animate-slide-in shadow-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-500" />
                {error}
              </div>
            )}
          </div>
        );

      case 'results':
        if (loading) return <AnalysisLoadingScreen active={loading} />;

        return (
          <div className="space-y-6">
            {/* Result sub-tabs */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-neutral-200">
              {(['list', 'detail', 'route'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveResultTab(tab)}
                  disabled={tab === 'detail' && !selectedRec}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-md ${
                    activeResultTab === tab
                      ? 'bg-agri-600 text-white shadow-sm'
                      : 'text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  {tab === 'list' ? 'All Markets' : tab === 'detail' ? 'Full Detail' : 'Route'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-8">
              {activeResultTab === 'list' && (
                <TopMarketsList
                  recommendations={recommendations}
                  selectedMarketId={selectedRec?.marketId}
                  onSelect={(rec) => { setSelectedRec(rec); setActiveResultTab('detail'); }}
                />
              )}

              {activeResultTab === 'detail' && selectedRec && (
                <MarketRecommendationDetail
                  recommendation={selectedRec}
                  rank={recommendations.indexOf(selectedRec) + 1}
                />
              )}

              {activeResultTab === 'route' && selectedRec && (
                <RouteSection recommendation={selectedRec} farmerLocation={location} />
              )}
            </div>

            {/* Actions */}
            {recommendations.length > 0 && selectedRec && (
              <FarmerActionsBar
                topRecommendation={selectedRec}
                analysisInput={analysisInput}
                onViewRoute={() => setActiveResultTab('route')}
                onCompareMarkets={() => setActiveResultTab('list')}
                onViewStorage={() => { setActiveResultTab('detail'); }}
                onViewTransport={() => { setActiveResultTab('detail'); }}
                onReserveStall={() => setBookingOpen(true)}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const meta = STEP_META[step];
  const isResults = step === 'results';
  const isReview = step === 'review';

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-16 px-6 lg:px-8 animate-fade-in">
      {/* ── Top navigation ────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={step === 'products' ? onBack : prev}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-bold bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm"
        >
          <ChevronLeft size={16} /> {step === 'products' ? 'Dashboard' : 'Back'}
        </button>

        {/* Step indicators */}
        {!isResults && (
          <div className="hidden sm:flex items-center gap-3">
            {STEP_ORDER.filter((s) => s !== 'results').map((s) => {
              const idx = STEP_ORDER.indexOf(s);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCurrent ? 'bg-agri-600 text-white shadow-md' :
                      isPast ? 'bg-agri-100 text-agri-700' :
                      'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {isPast ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  {idx < STEP_ORDER.length - 2 && (
                    <div className={`w-6 h-0.5 rounded-full ${isPast ? 'bg-agri-200' : 'bg-neutral-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isResults && recommendations.length > 0 && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[10px] text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 px-3 py-1.5 rounded shadow-sm font-mono font-bold uppercase tracking-widest transition-colors"
          >
            <X size={12} strokeWidth={3} /> New analysis
          </button>
        )}
      </div>

      {/* ── Progress bar (mobile wizard only) ─────────────────────── */}
      {!isResults && (
        <div className="sm:hidden w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-8">
          <div
            className="bg-agri-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${((currentIdx + 1) / (STEP_ORDER.length - 1)) * 100}%` }}
          />
        </div>
      )}

      {/* ── Step header ───────────────────────────────────── */}
      <div className="mb-10 text-center sm:text-left">
        {!isResults && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 rounded-full mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-agri-500"></span>
            <p className="data-label !text-neutral-600 !tracking-widest">
              Step {currentIdx + 1} of {STEP_ORDER.length - 1}
            </p>
          </div>
        )}
        <h2 className="font-display font-black text-3xl md:text-4xl text-neutral-900 tracking-tight mb-3">
          {meta.title}
        </h2>
        <p className="text-base text-neutral-500 font-medium">{meta.subtitle}</p>
      </div>

      {/* ── Loading overlay ───────────────────────────────── */}
      {loading && <AnalysisLoadingScreen active={loading} />}

      {/* ── Step content ──────────────────────────────────── */}
      {!loading && (
        <div className="animate-slide-in">
          {renderStepContent()}
        </div>
      )}

      {/* ── Bottom nav (not on results) ───────────────────── */}
      {!isResults && !loading && (
        <div className="mt-12 pt-6 border-t border-neutral-100 flex items-center justify-between gap-4">
          {step !== 'products' ? (
            <button onClick={prev} className="action-btn-secondary px-8 py-4 text-sm font-bold bg-white rounded shadow-sm hover:bg-neutral-50">
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div></div>}
          
          {isReview ? (
            <button
              onClick={runAnalysis}
              disabled={!canProceed() || loading}
              className="action-btn-agri px-10 py-4 text-sm font-black tracking-wider rounded shadow-lg hover:-translate-y-0.5 transition-transform"
            >
              Run Market Analysis <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canProceed()}
              className="action-btn-agri px-10 py-4 text-sm font-black tracking-wider rounded shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Continue <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* ── Stall booking modal ───────────────────────────── */}
      {selectedRec && (
        <StallBookingFlow
          isOpen={bookingOpen}
          onClose={() => setBookingOpen(false)}
          predictionData={{
            best_market: selectedRec.marketName,
            expected_profit: selectedRec.costBreakdown.netReturn ?? 0,
            confidence_score: selectedRec.score,
            urgency_level: 'Moderate',
            sell_now_override: false,
            simple_summary: `Sell at ${selectedRec.marketName}`,
            logistics: {
              distance_km: selectedRec.distanceKm,
              travel_duration_mins: selectedRec.travelTimeMins,
              traffic_delay_prob: 'Low',
              estimated_arrival: `${selectedRec.travelTimeMins} min`,
              arrival_sync_status: 'On-Time',
              transit_quality_loss: 0,
              road_type_risk: 'Low',
              alternate_route_available: false,
            },
            storage_advisory: {
              is_worth_it: false,
              reasoning: '',
              cooling_advised: false,
              max_safe_hours: 48,
              stack_height_limit: '',
              ventilation_required: false,
              expected_grade_loss: '',
            },
            strategy_breakdown: { market_justification: '', timing_justification: '', risk_mitigation_summary: '', delay_consequence: '' },
            resilience_hub: { alternate_plan: { market_name: '', estimated_profit: 0, profit_delta: 0, reason_for_fallback: '', feasibility_score: 0 }, emergency_plan: { market_name: '', estimated_profit: 0, profit_delta: 0, reason_for_fallback: '', feasibility_score: 0 }, shock_triggers: { weather_alert: false, price_crash_alert: false, road_blockage_alert: false } },
            market_ethics: { trust_score: 0, fairness_rating: 'Standard', price_deviation_percent: 0, payment_reliability_roadmap: '', historical_consistency: '' },
            status_monitor: { listing_status: 'Not Listed', current_state: 'On Track', safe_window_hours: 48 },
            collective_intelligence: { nearby_match_count: 0, is_opportunity_present: false, estimated_savings: 0, cooperation_hint: '', privacy_status: '', sharing_split_details: '' },
            current_mandi_price: selectedRec.offers[0]?.price ?? 0,
            last_updated_mins: 0,
            price_trend_sentiment: 'Stable',
            historical_avg_comparison: '',
            min_safe_price: 0,
            quality_loss_per_day: 0,
            next_grade_downgrade_eta: '',
            weather: { temp: 0, humidity: 0, rain_chance: 0, condition: '', storageImpact: '', riskMultiplier: 1 },
            spoilage_risk: '',
            spoilage_rate: 0,
            spoilage_curve: [],
            ai_reasoning: '',
            route_safety_score: 0,
            transport_cost: selectedRec.costBreakdown.transportCost ?? 0,
            alternate_market: { name: recommendations[1]?.marketName ?? '', profit: 0, distance: '' },
            profit_forecast: [],
            price_trend: [],
            risk_factors: [],
            market_trust: { score: 0, fairness: '', paymentSpeed: '' },
            storage_advice: { coolingRequired: false, stackHeight: '', humidityWarning: '' },
            community: { nearbyFarmers: 0, potentialCost_saving: 0, activePools: [] },
            sdg_impact: { waste_reduction_kg: 0, primary_sdg: '', impact_statement: '' },
            best_day: '',
            best_hour_window: '',
            actual_profit: undefined,
          }}
          userInput={{
            cropType: products[0]?.productName as any ?? 'Tomato' as any,
            farmerType: 'Small/Marginal' as any,
            harvestDate: 'today',
            quantity: products.reduce((s, p) => s + p.quantity, 0),
            quantityUnit: 'Kg',
            location,
            storageAvailable: false,
            travelRange: Math.round(selectedRec.distanceKm),
          }}
          preLoadedMarketId={null}
        />
      )}
    </div>
  );
};

const ReviewSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="border border-neutral-200 bg-white p-6 rounded-xl shadow-sm h-full flex flex-col justify-center">
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
    {children}
  </div>
);

export default MarketAnalysisWizard;
