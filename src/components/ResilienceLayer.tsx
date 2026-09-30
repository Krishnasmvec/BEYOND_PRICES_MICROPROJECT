
import React, { useState } from 'react';
import { ResilienceLayer as ResilienceType } from '../../shared/types.ts';
import { formatINR } from '../lib/format';
import { 
  ShieldCheck, 
  RotateCcw, 
  AlertTriangle, 
  ArrowRight, 
  Zap,
  TrendingDown,
  CloudRain,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ResilienceLayerProps {
  data: ResilienceType;
}

const ResilienceLayer: React.FC<ResilienceLayerProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const hasShocks = data.shock_triggers.weather_alert || data.shock_triggers.price_crash_alert;

  return (
    <div className="space-y-6">
      {/* Resilience Indicator Bar */}
      <div className={`p-4 border-2 flex items-center justify-between transition-all ${hasShocks ? 'bg-amber-50 border-amber-600' : 'bg-agri-50 border-agri-600'}`}>
         <div className="flex items-center gap-3">
            <ShieldCheck size={18} className={hasShocks ? 'text-amber-600' : 'text-agri-600'} />
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-900">System Resilience: Prepared</h4>
               <p className="text-[8px] font-bold text-neutral-400 uppercase">2 Fallback Paths Pre-calculated</p>
            </div>
         </div>
         {hasShocks && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-600 text-white text-[8px] font-black uppercase animate-pulse">
               <AlertTriangle size={10} /> External Shock Detected
            </div>
         )}
         <button onClick={() => setExpanded(!expanded)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
         </button>
      </div>

      {expanded && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          {/* Rank 2: Alternate Plan */}
          <div className="bg-white border border-neutral-200 p-8 space-y-6 relative overflow-hidden group">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                      <RotateCcw size={12} /> Rank 2 Strategy
                   </div>
                   <h5 className="text-2xl font-display font-black text-neutral-900 uppercase tracking-tighter">
                      {data.alternate_plan.market_name}
                   </h5>
                </div>
                <div className="text-right">
                   <div className="text-xs font-black text-red-500">{formatINR(data.alternate_plan.profit_delta)}</div>
                   <div className="text-[8px] font-bold text-neutral-300 uppercase">Profit Delta</div>
                </div>
             </div>

             <div className="p-4 bg-neutral-50 border border-neutral-100 text-[11px] font-medium leading-relaxed italic text-neutral-600">
                "{data.alternate_plan.reason_for_fallback}"
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                <div className="flex items-center gap-2">
                   <Activity size={12} className="text-neutral-300" />
                   <span className="text-[9px] font-black uppercase text-neutral-400">Path Safety: {data.alternate_plan.feasibility_score}%</span>
                </div>
                <button className="text-[9px] font-black uppercase text-blue-600 flex items-center gap-2 hover:gap-4 transition-all">
                   Switch Now <ArrowRight size={14} />
                </button>
             </div>
          </div>

          {/* Rank 3: Emergency Salvage */}
          <div className="bg-white border border-red-200 p-8 space-y-6 relative overflow-hidden group">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-widest">
                      <Zap size={12} /> Emergency Net
                   </div>
                   <h5 className="text-2xl font-display font-black text-neutral-900 uppercase tracking-tighter">
                      {data.emergency_plan.market_name}
                   </h5>
                </div>
                <div className="text-right">
                   <div className="text-xs font-black text-red-600">{formatINR(data.emergency_plan.profit_delta)}</div>
                   <div className="text-[8px] font-bold text-neutral-300 uppercase">Min Salvage</div>
                </div>
             </div>

             <div className="p-4 bg-red-50 border border-red-100 text-[11px] font-bold leading-relaxed text-red-800">
                "{data.emergency_plan.reason_for_fallback}"
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                <div className="flex items-center gap-2">
                   <AlertTriangle size={12} className="text-red-300" />
                   <span className="text-[9px] font-black uppercase text-red-300">Hard Override Available</span>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors">
                   Activate Salvage
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Shock Triggers HUD (Secondary Info) */}
      {expanded && (
        <div className="grid grid-cols-3 gap-4 border-t border-neutral-100 pt-6">
           <div className={`p-3 border flex flex-col gap-2 ${data.shock_triggers.weather_alert ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
              <CloudRain size={14} />
              <span className="text-[8px] font-black uppercase">Weather Shock: {data.shock_triggers.weather_alert ? 'ACTIVE' : 'NOMINAL'}</span>
           </div>
           <div className={`p-3 border flex flex-col gap-2 ${data.shock_triggers.price_crash_alert ? 'bg-red-50 border-red-200 text-red-800' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
              <TrendingDown size={14} />
              <span className="text-[8px] font-black uppercase">Price Crash: {data.shock_triggers.price_crash_alert ? 'ACTIVE' : 'NOMINAL'}</span>
           </div>
           <div className={`p-3 border flex flex-col gap-2 ${data.shock_triggers.road_blockage_alert ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
              <Activity size={14} />
              <span className="text-[8px] font-black uppercase">Road Status: {data.shock_triggers.road_blockage_alert ? 'DELAYED' : 'CLEAR'}</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResilienceLayer;
