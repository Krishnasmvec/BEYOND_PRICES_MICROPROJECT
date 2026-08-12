
import React from 'react';
import { MarketEthics } from '../types';
import { 
  ShieldCheck, 
  Scale, 
  AlertCircle, 
  History, 
  Wallet,
  Star,
  CheckCircle2,
  Info
} from 'lucide-react';

interface MarketEthicsCardProps {
  data: MarketEthics;
}

const MarketEthicsCard: React.FC<MarketEthicsCardProps> = ({ data }) => {
  const isFair = data.fairness_rating === 'High' || data.fairness_rating === 'Standard';
  const trustColor = data.trust_score > 80 ? 'text-agri-600' : 'text-amber-600';

  return (
    <div className="bg-white border border-neutral-200 shadow-sm overflow-hidden h-full flex flex-col">
       {/* Ethics Header */}
       <div className="bg-neutral-900 px-8 py-4 flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-agri-400 flex items-center gap-2">
             <Scale size={14} /> Market Fairness Monitor
          </h4>
          <div className="flex items-center gap-1">
             {[1,2,3,4,5].map((star) => (
               <Star 
                 key={star} 
                 size={10} 
                 className={star <= (data.trust_score / 20) ? 'fill-agri-400 text-agri-400' : 'text-neutral-700'} 
               />
             ))}
          </div>
       </div>

       <div className="p-10 space-y-10 flex-1">
          {/* Trust Score & Consistency */}
          <div className="flex gap-6">
             <div className="w-12 h-12 bg-agri-50 text-agri-600 flex items-center justify-center shrink-0 border border-agri-100">
                <ShieldCheck size={20} />
             </div>
             <div className="space-y-1">
                <div className="flex items-center justify-between w-full">
                   <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Trust Index</h5>
                   <span className={`text-sm font-black ${trustColor}`}>{data.trust_score}/100</span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-neutral-800">
                   {data.historical_consistency}
                </p>
             </div>
          </div>

          {/* Fairness Guard */}
          <div className={`p-6 border-l-4 space-y-3 ${isFair ? 'bg-agri-50 border-agri-600' : 'bg-amber-50 border-amber-500'}`}>
             <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${isFair ? 'text-agri-600' : 'text-amber-600'}`}>
                   {isFair ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                   Fairness Status: {data.fairness_rating}
                </div>
                <div className="text-[9px] font-bold text-neutral-400">DEV: {data.price_deviation_percent}%</div>
             </div>
             <p className={`text-xs leading-relaxed ${isFair ? 'text-agri-800' : 'text-amber-800'}`}>
                {isFair 
                  ? "Current price aligns with historical regional benchmarks. Lower risk of exploitation."
                  : "Caution: Price is deviating from historical averages. Market volatility detected."}
             </p>
          </div>

          {/* Payment Roadmap */}
          <div className="flex gap-6 opacity-60">
             <div className="w-12 h-12 bg-neutral-100 text-neutral-400 flex items-center justify-center shrink-0">
                <Wallet size={20} />
             </div>
             <div className="space-y-1">
                <h5 className="text-[10px] font-black uppercase text-neutral-300 tracking-widest">Payment Reliability</h5>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">
                   {data.payment_reliability_roadmap}
                </p>
                <div className="text-[8px] font-black text-blue-500 bg-blue-50 inline-block px-2 py-0.5 uppercase tracking-widest mt-1">
                   Feature Roadmap 2025
                </div>
             </div>
          </div>
       </div>

       {/* Ethics Footer */}
       <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2">
          <Info size={12} className="text-neutral-400" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-400">
             Protective Intelligence: Price deviation logic monitors for unfair trade spikes.
          </span>
       </div>
    </div>
  );
};

export default MarketEthicsCard;
