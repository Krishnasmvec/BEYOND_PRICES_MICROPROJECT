
import React from 'react';
import { LogisticsDetail } from '../types';
import { 
  Truck, 
  Timer, 
  MapPin, 
  Signal, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  Navigation,
  Compass
} from 'lucide-react';

interface LogisticsHUDProps {
  data: LogisticsDetail;
  marketName: string;
}

const LogisticsHUD: React.FC<LogisticsHUDProps> = ({ data, marketName }) => {
  const isSafe = data.arrival_sync_status === 'On-Time';
  const isHighRisk = data.road_type_risk === 'High' || data.traffic_delay_prob === 'High';

  return (
    <div className="bg-neutral-900 text-white border-4 border-neutral-900 p-10 space-y-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Compass size={150} />
      </div>

      {/* Header Sync - Dual Labeling (Expert / Common) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
         <div className="space-y-1">
            <h4 className="mono-label text-agri-400 flex items-center gap-2">
               <Navigation size={14} /> Travel Plan / How to get there
            </h4>
            <div className="text-4xl font-display font-black tracking-tighter uppercase leading-none">
               Destination: {marketName}
            </div>
         </div>
         <div className={`px-8 py-3 flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg border-l-8 ${isSafe ? 'bg-agri-900 border-agri-600 text-agri-100' : 'bg-amber-900 border-amber-500 text-amber-100'}`}>
            <Signal size={16} /> Roadmap Status: {isSafe ? 'Clear Path' : 'Possible Delay'}
         </div>
      </div>

      {/* Metric Grid - High & Low Words combined for better understanding */}
      <div className="grid md:grid-cols-3 gap-8 relative z-10">
         <div className="bg-white/5 p-8 border border-white/10 space-y-4 hover:bg-white/10 transition-colors">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-[10px] font-black text-agri-400 uppercase tracking-widest">
                  <MapPin size={12} /> Distance / Gap
               </div>
               <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">How far is the market?</p>
            </div>
            <div className="text-5xl font-black">{data.distance_km} <span className="text-sm text-neutral-500 font-black">KM</span></div>
         </div>

         <div className="bg-white/5 p-8 border border-white/10 space-y-4 hover:bg-white/10 transition-colors">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-[10px] font-black text-agri-400 uppercase tracking-widest">
                  <Timer size={12} /> Duration / Time
               </div>
               <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">How long is the drive?</p>
            </div>
            <div className="text-5xl font-black">{data.travel_duration_mins} <span className="text-sm text-neutral-500 font-black">MINS</span></div>
         </div>

         <div className="bg-white/5 p-8 border border-white/10 space-y-4 hover:bg-white/10 transition-colors">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-[10px] font-black text-agri-400 uppercase tracking-widest">
                  <Zap size={12} /> Arrival Sync / Goal Time
               </div>
               <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">When will you reach?</p>
            </div>
            <div className="text-3xl font-black uppercase tracking-tight">{data.estimated_arrival}</div>
         </div>
      </div>

      {/* Departure Suggestion Overlay */}
      <div className="p-8 border-l-8 border-agri-600 bg-agri-950/50 flex flex-col md:flex-row justify-between items-center gap-8 animate-slide-up">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-agri-600/20 text-agri-600 flex items-center justify-center rounded-full border border-agri-600/30">
               <Timer size={32} />
            </div>
            <div className="space-y-1">
               <h4 className="text-xl font-black uppercase tracking-tight text-agri-100">Recommended Departure</h4>
               <p className="text-[10px] font-bold text-agri-400 uppercase tracking-widest leading-none">Stay ahead of the market rush</p>
            </div>
         </div>
         <div className="text-center md:text-right">
            <div className="text-5xl font-black text-white leading-none">
               {(() => {
                  // Formula: estimated_arrival - travel_duration - 15min buffer
                  const [h, m] = data.estimated_arrival.split(':').map(Number);
                  const d = new Date(); d.setHours(h); d.setMinutes(m);
                  const departure = new Date(d.getTime() - (data.travel_duration_mins + 15) * 60000);
                  return departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
               })()}
            </div>
            <p className="mono-label text-agri-500 text-[10px] mt-2">LEAVE FARM AT PRECISELY THIS TIME</p>
         </div>
      </div>

      {/* High-Impact Warning Overlay */}
      {isHighRisk && (
        <div className="p-6 bg-red-600 text-white flex items-center gap-6 shadow-2xl animate-pulse">
           <AlertTriangle size={32} />
           <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest">Important: Road Hazards or Traffic Detected</p>
              <p className="text-[10px] font-bold uppercase opacity-80">Consider leaving 30 minutes earlier to arrive on time.</p>
           </div>
        </div>
      )}

      {/* Technical Metadata Footer */}
      <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
         <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Logistics Engine v2.4a</span>
         <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Risk Assessment: {data.road_type_risk} Terrain</span>
      </div>
    </div>
  );
};

export default LogisticsHUD;
