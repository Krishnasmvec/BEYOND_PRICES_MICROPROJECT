
import React, { useState, useEffect, useMemo } from 'react';
import { ConsumerPrediction, ConsumerAlert, NearbyMarket, MarketProduct, MarketWeather } from '../../shared/types.ts';
import { fetchNearbyMarkets, fetchMarketProducts } from '../lib/api';
import { formatIndianNumber } from '../lib/format';
import MarketCard from './MarketCard';
import MarketCardSkeleton from './MarketCardSkeleton';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import RecommendedMarketSummary from './RecommendedMarketSummary';
import MarketWeatherSnapshot from './MarketWeatherSnapshot';
import {
  MapPin,
  TrendingDown,
  ArrowLeft,
  Info,
  Leaf,
  X,
  MessageSquare,
  AlertCircle,
  Search,
  Package,
  DollarSign,
  Sparkles,
  Clock,
  ShieldCheck,
  Store,
} from 'lucide-react';

interface ConsumerDashboardProps {
  data: ConsumerPrediction;
  location: string;
  onReset: () => void;
}

type MarketFilter = 'distance' | 'price' | 'availability' | 'freshness' | null;
type ProductFilter = 'price' | 'availability' | 'freshness' | null;
type Stage = 'markets' | 'market-detail';

const AVAILABILITY_RANK: Record<string, number> = { 'High Supply': 3, 'Medium Supply': 2, 'Low Supply': 1, 'Out of Stock': 0 };
const FRESHNESS_RANK: Record<string, number> = { 'Harvested Today': 2, 'Harvested Yesterday': 1, '2+ Days Old': 0 };

const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ data, location, onReset }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const [stage, setStage] = useState<Stage>('markets');
  const [nearbyMarkets, setNearbyMarkets] = useState<NearbyMarket[] | null>(null);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>(null);

  const [selectedMarket, setSelectedMarket] = useState<NearbyMarket | null>(null);
  const [products, setProducts] = useState<MarketProduct[] | null>(null);
  const [weather, setWeather] = useState<MarketWeather | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<ProductFilter>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showRecommendation, setShowRecommendation] = useState(false);

  // Aborts a superseded call (React StrictMode double-firing this effect in
  // dev, or `location` changing again before the previous fetch resolves)
  // instead of just ignoring its result — /api/markets/nearby shares a
  // scarce 1 req/sec global geocoding budget (see lib/api.ts), so letting a
  // stale request complete anyway would waste part of it and could 429 the
  // request that actually matters.
  useEffect(() => {
    const controller = new AbortController();
    setLoadingMarkets(true);
    setMarketsError(null);

    fetchNearbyMarkets(location, controller.signal)
      .then(setNearbyMarkets)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setMarketsError(err.message || 'Could not find nearby markets.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMarkets(false);
      });

    return () => controller.abort();
  }, [location]);

  const loadMarkets = () => {
    setLoadingMarkets(true);
    setMarketsError(null);
    fetchNearbyMarkets(location)
      .then(setNearbyMarkets)
      .catch((err) => setMarketsError(err.message || 'Could not find nearby markets.'))
      .finally(() => setLoadingMarkets(false));
  };

  const handleSelectMarket = (market: NearbyMarket) => {
    setSelectedMarket(market);
    setStage('market-detail');
    setProducts(null);
    setWeather(null);
    setProductsError(null);
    setShowRecommendation(false);
    setProductFilter(null);
    setCategoryFilter('');
    setLoadingProducts(true);

    fetchMarketProducts(market.id)
      .then(({ products: prods, weather: marketWeather }) => {
        setProducts(prods);
        setWeather(marketWeather);
        setLoadingProducts(false);
        // Brief, honest pacing beat — the summary below is a real
        // computation over data already fetched, not a network call, but
        // revealing it instantly reads as jarring after two loading stages.
        window.setTimeout(() => setShowRecommendation(true), 400);
      })
      .catch((err) => {
        setProductsError(err.message || 'Could not load products for this market.');
        setLoadingProducts(false);
      });
  };

  const handleBackToMarkets = () => {
    setStage('markets');
  };

  const sortedMarkets = useMemo(() => {
    if (!nearbyMarkets) return [];
    const list = [...nearbyMarkets];
    if (marketFilter === 'availability') {
      list.sort((a, b) => AVAILABILITY_RANK[b.availability] - AVAILABILITY_RANK[a.availability]);
    } else if (marketFilter === 'price') {
      list.sort((a, b) => a.avgPrice - b.avgPrice);
    } else if (marketFilter === 'freshness') {
      list.sort((a, b) => b.avgFreshness - a.avgFreshness);
    } else {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return list;
  }, [nearbyMarkets, marketFilter]);

  const totalProducts = useMemo(
    () => (nearbyMarkets ? nearbyMarkets.reduce((sum, m) => sum + m.productCount, 0) : 0),
    [nearbyMarkets]
  );

  // Dynamic, never hardcoded — only categories that actually appear among
  // this market's real products.
  const availableCategories = useMemo(() => {
    if (!products) return [];
    const categories = new Set<string>();
    products.forEach((p) => { if (p.category) categories.add(p.category); });
    return Array.from(categories).sort();
  }, [products]);

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    let list = [...products];
    if (categoryFilter) {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (productFilter === 'price') {
      list.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    } else if (productFilter === 'availability') {
      list.sort((a, b) => AVAILABILITY_RANK[b.availability] - AVAILABILITY_RANK[a.availability]);
    } else if (productFilter === 'freshness') {
      list.sort((a, b) => FRESHNESS_RANK[b.freshness] - FRESHNESS_RANK[a.freshness]);
    }
    return list;
  }, [products, productFilter, categoryFilter]);

  const activeAlerts = (data.alerts || []).filter(a => !dismissedAlerts.includes(a.id));

  const getAlertIcon = (type: ConsumerAlert['type'] | string) => {
    switch (type) {
      case 'price': return <TrendingDown size={14} />;
      case 'freshness': return <Leaf size={14} />;
      case 'distance': return <MapPin size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 space-y-12 animate-fade-in pb-40">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-neutral-200 pb-12 gap-8">
        <div className="space-y-4">
          <button onClick={onReset} className="mono-label text-neutral-400 hover:text-navy-900 transition-colors flex items-center gap-2">
            <ArrowLeft size={12} /> Search Different Area
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-6xl font-display font-black tracking-tighter text-neutral-900 uppercase leading-none">
              Market Search <span className="text-neutral-300">/</span> {location}
            </h2>
          </div>
          {nearbyMarkets && (
            <p className="mono-label text-neutral-400">{nearbyMarkets.length} nearby markets found, sorted by distance</p>
          )}
        </div>

        {typeof data.regionalSupplyStrength === 'number' && (
          <div className="text-right">
            <p className="mono-label text-neutral-400 mb-1">Regional Food Supply</p>
            <div className="text-3xl font-black text-navy-900 number-tabular">{data.regionalSupplyStrength}%</div>
          </div>
        )}
      </header>

      {/* Live stats — real counts from the fetch above, not placeholders */}
      {nearbyMarkets && (
        <div className="grid grid-cols-3 divide-x divide-neutral-200 border border-neutral-200 bg-white">
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-agri-50 text-agri-600 flex items-center justify-center shrink-0">
              <Store size={18} />
            </div>
            <div>
              <p className="mono-label text-neutral-400">Markets Found</p>
              <p className="text-2xl font-black text-neutral-900 number-tabular">{nearbyMarkets.length}</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-agri-50 text-agri-600 flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
            <div>
              <p className="mono-label text-neutral-400">Products Listed</p>
              <p className="text-2xl font-black text-neutral-900 number-tabular">{formatIndianNumber(totalProducts)}</p>
            </div>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-agri-50 text-agri-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="mono-label text-neutral-400">Data Source</p>
              <p className="text-sm font-black text-neutral-900">Verified Market Data</p>
            </div>
          </div>
        </div>
      )}

      {/* Simple Instruction Bar - "Low Words" for the common shopper */}
      {data.simple_advice && (
        <div className="bg-agri-600 text-white p-8 flex items-center gap-8 shadow-xl border-l-8 border-navy-900">
           <div className="w-14 h-14 bg-white/20 flex items-center justify-center rounded-full shrink-0 shadow-inner">
              <MessageSquare size={28} />
           </div>
           <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Today's Best Move / Daily Advice</span>
              <p className="text-2xl font-display font-black uppercase tracking-tight leading-none italic">
                 "{data.simple_advice}"
              </p>
           </div>
        </div>
      )}

      {/* High-Impact Alerts */}
      {activeAlerts.length > 0 && (
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="shrink-0 flex items-center gap-4 bg-navy-900 text-white px-6 py-4 rounded-full shadow-lg animate-fade-in group border border-white/10">
              <div className="w-8 h-8 rounded-full bg-agri-600 flex items-center justify-center">
                {getAlertIcon(alert.type)}
              </div>
              <div className="pr-4 border-r border-white/10">
                <p className="text-[11px] font-black uppercase tracking-widest leading-none">{alert.message}</p>
                <p className="text-[8px] font-bold text-navy-400 uppercase tracking-widest mt-1 italic">{alert.actionHint}</p>
              </div>
              <button onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])} className="p-1 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filters — contextual to whichever stage is active */}
      <div className="flex items-center gap-4 border-b border-neutral-100 pb-8 flex-wrap">
        <span className="mono-label text-neutral-400 mr-4">Filter By:</span>
        {stage === 'markets' ? (
          <>
            <button
              onClick={() => setMarketFilter(marketFilter === 'distance' ? null : 'distance')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${marketFilter === 'distance' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <MapPin size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Nearest</span>
            </button>
            <button
              onClick={() => setMarketFilter(marketFilter === 'price' ? null : 'price')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${marketFilter === 'price' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <DollarSign size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Lowest Price</span>
            </button>
            <button
              onClick={() => setMarketFilter(marketFilter === 'freshness' ? null : 'freshness')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${marketFilter === 'freshness' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <Leaf size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Highest Freshness</span>
            </button>
            <button
              onClick={() => setMarketFilter(marketFilter === 'availability' ? null : 'availability')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${marketFilter === 'availability' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <Package size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Highest Availability</span>
            </button>
            {marketFilter && (
              <button onClick={() => setMarketFilter(null)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Reset Filters</button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setProductFilter(productFilter === 'price' ? null : 'price')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${productFilter === 'price' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <DollarSign size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Price</span>
            </button>
            <button
              onClick={() => setProductFilter(productFilter === 'availability' ? null : 'availability')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${productFilter === 'availability' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <Package size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Availability</span>
            </button>
            <button
              onClick={() => setProductFilter(productFilter === 'freshness' ? null : 'freshness')}
              className={`flex items-center gap-3 px-8 py-4 rounded-full border-2 transition-all ${productFilter === 'freshness' ? 'bg-agri-600 border-agri-600 text-white' : 'border-neutral-200 text-neutral-400 hover:border-neutral-900'}`}
            >
              <Leaf size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Freshness</span>
            </button>
            {availableCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-8 py-4 rounded-full border-2 bg-white transition-all text-xs font-black uppercase tracking-widest ${categoryFilter ? 'border-agri-600 text-agri-600' : 'border-neutral-200 text-neutral-400'}`}
              >
                <option value="">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            {(productFilter || categoryFilter) && (
              <button onClick={() => { setProductFilter(null); setCategoryFilter(''); }} className="text-[9px] font-black uppercase text-red-500 hover:underline">Reset Filters</button>
            )}
          </>
        )}
      </div>

      {/* Stage: Nearby Markets */}
      {stage === 'markets' && (
        <div className="space-y-8">
          {loadingMarkets && (
            <>
              <p className="mono-label text-neutral-400 flex items-center gap-2"><Search size={14} className="animate-pulse" /> Searching nearby markets...</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 4 }).map((_, i) => <MarketCardSkeleton key={i} />)}
              </div>
            </>
          )}

          {!loadingMarkets && marketsError && (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <AlertCircle size={48} className="text-neutral-200" />
              <p className="mono-label text-neutral-400">{marketsError}</p>
              <button onClick={loadMarkets} className="text-xs font-black uppercase text-navy-900 underline underline-offset-4">Retry</button>
            </div>
          )}

          {!loadingMarkets && !marketsError && sortedMarkets.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMarkets.map((market) => (
                <MarketCard key={market.id} market={market} onClick={() => handleSelectMarket(market)} />
              ))}
            </div>
          )}

          {!loadingMarkets && !marketsError && sortedMarkets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Store size={48} className="text-neutral-200" />
              <p className="mono-label text-neutral-400">No markets found.</p>
            </div>
          )}
        </div>
      )}

      {/* Stage: Market Detail */}
      {stage === 'market-detail' && selectedMarket && (
        <div className="space-y-10">
          <button onClick={handleBackToMarkets} className="mono-label text-neutral-400 hover:text-navy-900 transition-colors flex items-center gap-2">
            <ArrowLeft size={12} /> Back to Nearby Markets
          </button>

          <div className="bg-neutral-900 text-white p-10 space-y-6">
            <h3 className="text-4xl font-display font-black uppercase tracking-tighter">{selectedMarket.name}</h3>
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="mono-label opacity-40">Distance</p>
                <p className="text-xl font-black">{selectedMarket.distanceKm} km <span className="text-sm font-medium opacity-60">/ ~{selectedMarket.travelTimeMins} min</span></p>
              </div>
              <div>
                <p className="mono-label opacity-40">Products Available</p>
                <p className="text-xl font-black number-tabular">{formatIndianNumber(selectedMarket.productCount)}</p>
              </div>
              <div>
                <p className="mono-label opacity-40 flex items-center gap-1"><Clock size={10} /> Last Updated</p>
                <p className="text-xl font-black">{new Date(selectedMarket.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          {weather && <MarketWeatherSnapshot weather={weather} />}

          {loadingProducts && (
            <>
              <p className="mono-label text-neutral-400 flex items-center gap-2"><Search size={14} className="animate-pulse" /> Finding available products...</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            </>
          )}

          {!loadingProducts && productsError && (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <AlertCircle size={48} className="text-neutral-200" />
              <p className="mono-label text-neutral-400">{productsError}</p>
            </div>
          )}

          {!loadingProducts && !productsError && sortedProducts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product) => <ProductCard key={product.id} product={product} marketLocation={selectedMarket.location} />)}
            </div>
          )}

          {!loadingProducts && !productsError && sortedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Package size={48} className="text-neutral-200" />
              <p className="mono-label text-neutral-400">No products available.</p>
            </div>
          )}

          {!loadingProducts && !showRecommendation && !productsError && (
            <p className="mono-label text-neutral-400 flex items-center gap-2"><Sparkles size={14} className="animate-pulse" /> Preparing recommendations...</p>
          )}

          {showRecommendation && nearbyMarkets && (
            <RecommendedMarketSummary market={selectedMarket} allMarkets={nearbyMarkets} />
          )}
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboard;
