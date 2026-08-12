
import React from 'react';
import { StrategyBreakdown } from '../types';
import { 
  Info, 
  Store, 
  Clock, 
  ShieldAlert, 
  ArrowRightCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface StrategyReasoningProps {
  data: StrategyBreakdown;
}

const StrategyReasoning: React.FC<StrategyReasoningProps> = ({ data }) => {
  return (
    <div className="bg-white border border-neutral-200 shadow-sm relative overflow-hidden h-full flex flex-col">
       {/* Trust Header */}
       <div className="bg-neutral-50 px-8 py-4 border-b border-neutral-100 flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
             <HelpCircle size={14} className="text-agri-600" /> Strategy Justification
          </h4>
          <span className="text-[9px] font-bold text-agri-600 bg-agri-50 px-3 py-1 border border-agri-100">
             EXPLAINABLE AI ENABLED
          </span>
       </div>

       <div className="p-10 space-y-10 flex-1">
          {/* Why This Market? */}
          <div className="flex gap-6">
             <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Store size={20} />
             </div>
             <div className="space-y-1">
                <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Why This Market?</h5>
                <p className="text-sm font-medium leading-relaxed text-neutral-800">
                   {data.market_justification}
                </p>
             </div>
          </div>

          {/* Why This Time? */}
          <div className="flex gap-6">
             <div className="w-12 h-12 bg-agri-900 text-white flex items-center justify-center shrink-0">
                <Clock size={20} />
             </div>
             <div className="space-y-1">
                <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Why This Time?</h5>
                <p className="text-sm font-medium leading-relaxed text-neutral-800">
                   {data.timing_justification}
                </p>
             </div>
          </div>

          {/* Risks Calculated */}
          <div className="flex gap-6">
             <div className="w-12 h-12 bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <ShieldAlert size={20} />
             </div>
             <div className="space-y-1">
                <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Risks We Evaluated</h5>
                <p className="text-sm font-medium leading-relaxed text-neutral-800">
                   {data.risk_mitigation_summary}
                </p>
             </div>
          </div>

          {/* Delay Consequence */}
          <div className="bg-red-50 p-6 border-l-4 border-red-500 space-y-3">
             <div className="flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-widest">
                <AlertTriangle size={14} /> Critical: Impact of 24h Delay
             </div>
             <p className="text-xs font-bold leading-relaxed text-red-800">
                {data.delay_consequence}
             </p>
          </div>
       </div>

       {/* Trust Signal Footer */}
       <div className="px-8 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center gap-3">
          <CheckCircle2 size={12} className="text-agri-600" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-400">
             Transparency protocol: Decision based on price-parity and decay indices
          </span>
       </div>
    </div>
  );
};

export default StrategyReasoning;
