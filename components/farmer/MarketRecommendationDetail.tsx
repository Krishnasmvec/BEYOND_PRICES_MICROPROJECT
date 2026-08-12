import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Truck,
  Box,
  LineChart,
  ShieldAlert,
} from 'lucide-react';
import type { MarketRecommendation, PriceInsight, StorageRisk } from '../../types';
import { formatINR } from '../../lib/format';

interface MarketRecommendationDetailProps {
  recommendation: MarketRecommendation;
  rank: number;
}

function RiskBadge({ level }: { level: StorageRisk['level'] }) {
  const classes: Record<StorageRisk['level'], string> = {
    high: 'bg-rose-100 text-rose-700 border border-rose-200',
    moderate: 'bg-amber-100 text-amber-700 border border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    unavailable: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
  };
  const labels: Record<StorageRisk['level'], string> = {
    high: 'High Risk',
    moderate: 'Moderate Risk',
    low: 'Low Risk',
    unavailable: 'No Data',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${classes[level]}`}>{labels[level]}</span>;
}

function TrendBadge({ insight }: { insight: PriceInsight }) {
  if (insight.trend === 'increasing') {
    return <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><TrendingUp size={14} /> Increasing</span>;
  }
  if (insight.trend === 'decreasing') {
    return <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold"><TrendingDown size={14} /> Decreasing</span>;
  }
  if (insight.trend === 'stable') {
    return <span className="inline-flex items-center gap-1 text-neutral-600 bg-neutral-100 px-2 py-1 rounded text-xs font-bold"><Minus size={14} /> Stable</span>;
  }
  return <span className="text-xs font-medium text-neutral-400">Insufficient data</span>;
}

const MarketRecommendationDetail: React.FC<MarketRecommendationDetailProps> = ({
  recommendation: rec,
  rank,
}) => {
  const [showPrices, setShowPrices] = useState(true);
  const [showStorage, setShowStorage] = useState(false);
  const [showTransport, setShowTransport] = useState(false);

  const RANK_LABELS = ['Top Recommendation', 'Excellent Alternative', 'Viable Option'];
  const RANK_CLASSES = [
    'bg-agri-600 text-white', 
    'bg-neutral-800 text-white', 
    'bg-neutral-500 text-white'
  ];
  
  const rankClass = RANK_CLASSES[rank - 1] ?? 'bg-neutral-500 text-white';
  const rankLabel = RANK_LABELS[rank - 1] ?? `Rank #${rank}`;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Market header ────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded w-fit ${rankClass}`}>
                #{rank} &middot; {rankLabel}
              </span>
              <div className="flex items-center gap-1 bg-neutral-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Score: <span className="text-neutral-900">{rec.score}/100</span>
              </div>
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-neutral-900 tracking-tight">
              {rec.marketName}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-neutral-500">
              <MapPin size={16} className="text-neutral-400" />
              {rec.district}{rec.state ? `, ${rec.state}` : ''}
            </div>
          </div>
          
          <div className="flex gap-4 sm:gap-8 bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-100">
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Distance</p>
              <p className="font-black text-xl text-neutral-900">{rec.distanceKm} <span className="text-xs font-medium text-neutral-500">km</span></p>
            </div>
            <div className="w-px bg-neutral-200"></div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Travel Time</p>
              <p className="font-black text-xl text-neutral-900 flex items-center justify-center sm:justify-end gap-1.5">
                <Clock size={16} className="text-neutral-400" /> {rec.travelTimeMins} <span className="text-xs font-medium text-neutral-500">min</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cost breakdown ───────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-neutral-900 font-bold">
            <LineChart size={18} className="text-agri-600" />
            Financial Projection
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Based on reference prices
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-neutral-100">
          <CostCell
            label="Gross Sale Value"
            note="Quantity × Reference Price"
            value={rec.costBreakdown.saleValue}
            highlight
          />
          <CostCell
            label="Transport Cost"
            note="Logistics Data"
            value={rec.costBreakdown.transportCost}
          />
          <CostCell
            label="Storage Cost"
            note="Not in database"
            value={null}
            na
          />
          <div className="p-6 sm:p-8 bg-agri-50/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-agri-600/70 mb-1">Estimated Net Return</p>
            <p className="text-[9px] text-neutral-400 font-mono mb-3 uppercase tracking-wide">Sale Value − Transport</p>
            {rec.costBreakdown.netReturn != null ? (
              <p className="text-2xl sm:text-3xl font-black text-agri-700 tracking-tight">
                {formatINR(rec.costBreakdown.netReturn)}
              </p>
            ) : (
              <p className="text-sm font-medium text-neutral-400">Unavailable</p>
            )}
          </div>
        </div>

        {rec.costBreakdown.unpricedProductNames.length > 0 && (
          <div className="px-6 sm:px-8 py-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3 text-sm text-amber-800 font-medium">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <p>Price unavailable for: <span className="font-bold">{rec.costBreakdown.unpricedProductNames.join(', ')}</span>. Excluded from return calculation.</p>
          </div>
        )}
      </div>

      {/* ── Why this market ──────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-neutral-100">
          <h4 className="font-bold text-base text-neutral-900">Why {rec.marketName.split(' ')[0]}?</h4>
        </div>
        <div className="px-6 sm:px-8 py-6 space-y-4">
          {rec.whyBullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-agri-100 text-agri-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={12} strokeWidth={3} />
              </div>
              <span className="text-sm font-medium text-neutral-700 leading-relaxed">{bullet}</span>
            </div>
          ))}
        </div>

        {rec.explanation && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="p-5 bg-neutral-50 rounded-lg border border-neutral-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
                <ShieldAlert size={12} />
                AI Analysis based on verified data
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed font-medium">{rec.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Price insights ───────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowPrices((v) => !v)}
          className="w-full px-6 sm:px-8 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={18} className="text-agri-600" />
            <h4 className="font-bold text-base text-neutral-900">Price Insights</h4>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-neutral-100 text-neutral-500 rounded border border-neutral-200">
              Reference Data
            </span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showPrices ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {showPrices ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </button>

        {showPrices && (
          <div className="divide-y divide-neutral-100 border-t border-neutral-100">
            {rec.offers.map((offer) => {
              const insight = rec.priceInsights.find((p) => p.productId === offer.productId);
              return (
                <div key={offer.productId} className="px-6 sm:px-8 py-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-lg font-black text-neutral-900">{offer.productName}</p>
                      <p className="text-xs font-medium text-neutral-500 mt-1">{offer.quantityRequested} {offer.unit} requested</p>
                    </div>
                    <div className="sm:text-right bg-neutral-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                      {offer.price != null ? (
                        <>
                          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Current Price</p>
                          <p className="text-xl font-bold text-neutral-900 tracking-tight">{formatINR(offer.price)} <span className="text-sm font-medium text-neutral-500">/ {offer.unit}</span></p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-neutral-400">Price unavailable</p>
                      )}
                    </div>
                  </div>

                  {insight && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">Current Price</p>
                        <p className="text-base font-bold text-neutral-900">
                          {insight.currentPrice != null ? formatINR(insight.currentPrice) : <span className="text-neutral-400 font-medium text-sm">N/A</span>}
                        </p>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">7-Day Average</p>
                        <p className="text-base font-bold text-neutral-900">
                          {insight.sevenDayAvg != null ? formatINR(insight.sevenDayAvg) : <span className="text-neutral-400 font-medium text-sm">Insufficient data</span>}
                        </p>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 col-span-2 sm:col-span-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">Trend</p>
                        <TrendBadge insight={insight} />
                      </div>
                    </div>
                  )}

                  {offer.saleValue != null && (
                    <div className="flex items-center justify-between p-4 bg-agri-50 rounded-lg border border-agri-100">
                      <div className="flex items-center gap-2 text-agri-800 font-bold">
                        <CheckCircle size={16} className="text-agri-600" />
                        Estimated Sale Value
                      </div>
                      <span className="font-black text-lg text-agri-700 tracking-tight">{formatINR(offer.saleValue)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Storage risk ─────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowStorage((v) => !v)}
          className="w-full px-6 sm:px-8 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <Box size={18} className="text-neutral-600" />
            <h4 className="font-bold text-base text-neutral-900">Storage Advisory</h4>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showStorage ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-500'}`}>
            {showStorage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showStorage && (
          <div className="divide-y divide-neutral-100 border-t border-neutral-100">
            {rec.storageRisks.map((risk) => (
              <div key={risk.productId} className="px-6 sm:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <p className="text-lg font-black text-neutral-900">{risk.productName}</p>
                  <RiskBadge level={risk.level} />
                </div>
                
                <p className="text-sm font-medium text-neutral-600 leading-relaxed mb-6">{risk.reason}</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MiniCell label="Storage Type" value={risk.storageType} />
                  <MiniCell label="Max Safe Days" value={risk.maxStorageDays != null ? `${risk.maxStorageDays} days` : null} />
                  <MiniCell label="Ideal Temp" value={risk.idealTemperature != null ? `${risk.idealTemperature}°C` : null} />
                  <MiniCell label="Humidity Range" value={risk.humidityRange} />
                </div>
                
                {risk.recommendation && (
                  <div className="mt-5 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-3">
                    <ShieldAlert size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-800/70 mb-1">Recommendation</p>
                      <p className="text-sm font-medium text-indigo-900">{risk.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Transport pool ───────────────────────────── */}
      {rec.transportPool.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTransport((v) => !v)}
            className="w-full px-6 sm:px-8 py-5 flex items-center justify-between hover:bg-neutral-50 transition-colors focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-neutral-600" />
              <h4 className="font-bold text-base text-neutral-900">Transport Pool</h4>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showTransport ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-500'}`}>
              {showTransport ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {showTransport && (
            <div className="px-6 sm:px-8 py-6 border-t border-neutral-100 space-y-4">
              <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 font-medium mb-6">
                Transport pool data is limited. Departure times, capacity, and pricing are not currently tracked in the regional database.
              </div>
              
              <div className="space-y-3">
                {rec.transportPool.map((pool) => (
                  <div key={pool.poolId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">
                          {pool.vehicleType ?? 'Vehicle type unknown'}
                        </p>
                        {pool.updatedAt && (
                          <p className="text-xs font-medium text-neutral-500 mt-0.5">
                            Updated {new Date(pool.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                      pool.status?.toLowerCase() === 'available'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-neutral-200 text-neutral-500 bg-white'
                    }`}>
                      {pool.status ?? 'Status unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CostCell: React.FC<{
  label: string;
  note: string | null;
  value: number | null;
  highlight?: boolean;
  na?: boolean;
}> = ({ label, note, value, highlight, na }) => (
  <div className={`p-6 sm:p-8 ${highlight ? 'bg-neutral-50/50' : 'bg-white'}`}>
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{label}</p>
    {note && <p className="text-[9px] text-neutral-400 font-mono mb-3 uppercase tracking-wide">{note}</p>}
    <div className={!note ? "mt-5" : ""}>
      {na ? (
        <p className="text-sm font-medium text-neutral-400 mt-1">Not available</p>
      ) : value != null ? (
        <p className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          {formatINR(value)}
        </p>
      ) : (
        <p className="text-sm font-medium text-neutral-400 mt-1">Unavailable</p>
      )}
    </div>
  </div>
);

const MiniCell: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">{label}</p>
    {value != null
      ? <p className="text-sm font-bold text-neutral-900">{value}</p>
      : <p className="text-xs font-medium text-neutral-400 mt-1">N/A</p>
    }
  </div>
);

export default MarketRecommendationDetail;
