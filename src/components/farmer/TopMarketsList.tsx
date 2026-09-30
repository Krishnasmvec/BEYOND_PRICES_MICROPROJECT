import React from 'react';
import {
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Package,
} from 'lucide-react';
import type { MarketRecommendation } from '../../../shared/types.ts';
import { formatINR } from '../../lib/format';

interface TopMarketsListProps {
  recommendations: MarketRecommendation[];
  onSelect: (rec: MarketRecommendation) => void;
  selectedMarketId?: string;
}

const RANK_LABELS = ['Top Recommendation', 'Excellent Alternative', 'Viable Option'];
const RANK_CLASSES = [
  'bg-agri-600 text-white', 
  'bg-neutral-800 text-white', 
  'bg-neutral-500 text-white'
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'increasing') return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === 'decreasing') return <TrendingDown size={14} className="text-rose-500" />;
  return <Minus size={14} className="text-neutral-400" />;
}

const TopMarketsList: React.FC<TopMarketsListProps> = ({ recommendations, onSelect, selectedMarketId }) => {
  if (recommendations.length === 0) {
    return (
      <div className="border border-dashed border-neutral-200 bg-neutral-50/50 rounded-xl p-12 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100">
          <Package size={24} className="text-neutral-400" />
        </div>
        <p className="text-lg font-bold text-neutral-800 mb-2">No suitable markets found</p>
        <p className="text-sm text-neutral-500 font-medium">
          No markets in the database currently match your criteria or carry your selected products. Try adjusting your parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-xl text-neutral-900 tracking-tight">Market Analysis Results</h3>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">{recommendations.length} Markets Found</p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, idx) => {
          const isSelected = rec.marketId === selectedMarketId;
          const netReturn = rec.costBreakdown.netReturn;
          const saleValue = rec.costBreakdown.saleValue;
          const overallTrend = rec.priceInsights.length > 0
            ? rec.priceInsights.every((p) => p.trend === 'increasing')
              ? 'increasing'
              : rec.priceInsights.every((p) => p.trend === 'decreasing')
              ? 'decreasing'
              : 'stable'
            : 'insufficient_data';

          return (
            <button
              key={rec.marketId}
              onClick={() => onSelect(rec)}
              className={`w-full text-left rounded-xl transition-all duration-300 group overflow-hidden border ${
                isSelected
                  ? 'border-agri-500 bg-agri-50 shadow-md ring-1 ring-agri-500 ring-opacity-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              {/* Top strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 sm:py-5 border-b border-neutral-100 gap-4">
                <div className="flex flex-col gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded w-fit ${RANK_CLASSES[idx]}`}>
                    #{idx + 1} &middot; {RANK_LABELS[idx]}
                  </span>
                  <h3 className="font-display font-black text-xl text-neutral-900 group-hover:text-agri-700 transition-colors">
                    {rec.marketName}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4 self-start sm:self-center bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-neutral-100 shadow-sm sm:shadow-none">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Match Score</p>
                    <div className="flex items-end justify-end gap-1">
                      <span className="font-black text-2xl leading-none text-neutral-900">{rec.score}</span>
                      <span className="text-xs font-bold text-neutral-400 mb-0.5">/100</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                    idx === 0 ? 'bg-agri-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {rec.score}
                  </div>
                </div>
              </div>

              {/* Data strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-neutral-100">
                <DataPill label="Estimated Return" highlight>
                  {netReturn != null
                    ? <span className="text-lg font-black text-agri-700 tracking-tight">{formatINR(netReturn)}</span>
                    : <span className="text-sm font-medium text-neutral-400">Unavailable</span>
                  }
                </DataPill>
                <DataPill label="Gross Sale Value">
                  {saleValue != null
                    ? <span className="text-lg font-bold text-neutral-800 tracking-tight">{formatINR(saleValue)}</span>
                    : <span className="text-sm font-medium text-neutral-400">Unavailable</span>
                  }
                </DataPill>
                <DataPill label="Distance">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-neutral-400" />
                    <span className="text-base font-bold text-neutral-800">{rec.distanceKm} <span className="text-xs font-medium text-neutral-500">km</span></span>
                  </div>
                </DataPill>
                <DataPill label="Travel Time">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-neutral-400" />
                    <span className="text-base font-bold text-neutral-800">{rec.travelTimeMins} <span className="text-xs font-medium text-neutral-500">min</span></span>
                  </div>
                </DataPill>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-sm">
                    <TrendIcon trend={overallTrend} />
                    <span className="text-xs font-bold text-neutral-600">
                      {overallTrend === 'increasing' ? 'Prices Rising'
                        : overallTrend === 'decreasing' ? 'Prices Falling'
                        : overallTrend === 'stable' ? 'Prices Stable'
                        : 'Trend Limited'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-agri-400"></span>
                    <span className="text-xs font-medium text-neutral-500">
                      {rec.offers.length} product{rec.offers.length !== 1 ? 's' : ''} matched
                    </span>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-agri-600 group-hover:translate-x-1 transition-transform">
                  View Full Detail <ChevronRight size={14} strokeWidth={2.5} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DataPill: React.FC<{ label: string; highlight?: boolean; children: React.ReactNode }> = ({ label, highlight, children }) => (
  <div className={`p-4 sm:p-5 ${highlight ? 'bg-agri-50/30' : ''}`}>
    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${highlight ? 'text-agri-600/70' : 'text-neutral-400'}`}>{label}</p>
    {children}
  </div>
);

export default TopMarketsList;
