
import React from 'react';
import { PredictionResult } from '../../shared/types.ts';
import { formatIndianNumber } from '../lib/format';
import { 
  Zap, 
  Target, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

interface DecisionEngineProps {
  data: PredictionResult;
}

const DecisionEngine: React.FC<DecisionEngineProps> = ({ data }) => {
  const isUrgent = data.urgency_level === 'Critical' || data.urgency_level === 'High';
  const confidencePercent = (data.confidence_score * 100).toFixed(0);
  const isHighTrust = data.market_ethics.trust_score > 80;

  return (
    <div className="bg-white border-4 border-neutral-900 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Simple Instruction Bar - Operational Clarity for common people */}
      <div className="bg-agri-600 text-white p-8 flex items-center gap-8 border-b-4 border-neutral-900">
         <div className="w-16 h-16 bg-white/20 flex items-center justify-center rounded-full shrink-0 shadow-inner">
            <MessageSquare size={32} />
         </div>
         <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">The Simple Plan / What to do now:</span>
            <p className="text-2xl font-display font-black uppercase tracking-tight leading-none italic">
               "{data.simple_summary}"
            </p>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-neutral-900">
        {/* The Action Block (Institutional Data combined with Low Words) */}
        <div className={`flex-1 p-10 space-y-8 ${isUrgent ? 'bg-amber-50' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="px-3 py-1 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={10} className="text-agri-600" /> Strategic Plan / Expert Advice
            </div>
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isUrgent ? 'text-amber-600' : 'text-agri-600'}`}>
              <AlertCircle size={14} /> Rush Level: {data.urgency_level}
            </div>
          </div>

          <div className="space-y-2">
            <p className="mono-label text-neutral-400">Best Day to Sell / When to go</p>
            <h2 className="text-7xl font-display font-black text-neutral-900 uppercase tracking-tighter leading-none">
              {data.best_day}
            </h2>
            <div className="flex items-center gap-4 text-2xl font-black text-neutral-400 uppercase tracking-tight">
              <Clock className="text-agri-600" /> Best Time: {data.best_hour_window}
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-200/50 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-1">
              <p className="mono-label text-neutral-400">Target Market / Where to sell</p>
              <div className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
                <MapPin size={20} className="text-agri-600" /> {data.best_market}
              </div>
              {isHighTrust && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-agri-50 text-agri-600 text-[8px] font-black uppercase border border-agri-100 mt-2">
                   <ShieldCheck size={10} /> Trusted Store Location
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="mono-label text-neutral-400">System Confidence</p>
              <div className="flex items-center gap-3">
                 <div className="h-2 flex-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-agri-600" style={{width: `${confidencePercent}%`}}></div>
                 </div>
                 <span className="text-xl font-black italic">{confidencePercent}%</span>
              </div>
              <p className="text-[8px] font-bold text-neutral-300 uppercase">Verifying regional supply indices</p>
            </div>
          </div>
        </div>

        {/* The Profit Block (Money in Pocket) */}
        <div className="w-full lg:w-96 bg-neutral-900 text-white p-10 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Target size={180} />
           </div>
           
           <div className="relative z-10 space-y-2">
              <p className="mono-label text-agri-400">Expected Profit / Money in Pocket</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-agri-600">₹</span>
                <div className="text-7xl font-display font-black tracking-tighter number-tabular">
                  {formatIndianNumber(data.expected_profit)}
                </div>
              </div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pt-2 leading-relaxed">
                Actual money earned after taking out travel and costs.
              </p>
           </div>

           <button className="relative z-10 w-full py-6 bg-agri-600 text-white font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 hover:bg-agri-500 transition-all shadow-xl group mt-12">
              Commit to this Plan <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default DecisionEngine;
