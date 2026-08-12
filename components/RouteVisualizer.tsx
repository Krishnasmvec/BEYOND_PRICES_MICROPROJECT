
import React from 'react';
import { Truck, MapPin, Navigation, Signal, Activity, Target, ExternalLink } from 'lucide-react';

interface RouteVisualizerProps {
  market: string;
  safetyScore: number;
  risks: string[];
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ market, safetyScore, risks }) => {
  // Use a Google Maps embed based on the market name/location predicted by AI
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(market)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="w-full h-full bg-[#0F172A] relative overflow-hidden font-sans border-4 border-neutral-900 shadow-2xl">
      {/* Tactical UI Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-20 bg-neutral-900/90 border-b border-white/10 p-4 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-agri-600 rounded-full animate-pulse"></div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Market Location / Store Map</h4>
            <p className="text-[8px] font-bold text-neutral-500 uppercase mt-1 italic">Real-world Satellite View</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-[8px] font-black text-agri-600 uppercase">Route Safety</p>
              <p className="text-xs font-black text-white">{safetyScore}% Safe Path</p>
           </div>
           <a 
             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(market)}`} 
             target="_blank" 
             rel="noopener noreferrer"
             className="p-2 bg-white/5 hover:bg-agri-600 transition-colors text-white rounded border border-white/10"
             title="Open in Google Maps App"
           >
             <ExternalLink size={14} />
           </a>
        </div>
      </div>

      {/* The Functional Map Layer */}
      <div className="w-full h-full pt-16">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          title="Market Location Map"
          className="filter grayscale-[0.2] contrast-[1.1] brightness-90"
        ></iframe>
      </div>

      {/* Navigation HUD Overlays - Using "Low Words" for clarity */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
         <div className="bg-slate-900/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl min-w-[240px]">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
               <div className="flex items-center gap-2">
                  <Activity size={10} className="text-agri-600" />
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Active Waypoints / Points</span>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-agri-600 shadow-[0_0_8px_rgba(22,101,52,1)]"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">{market} (Store Location)</span>
               </div>
               <div className="flex items-center gap-3 opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">Your Farm Hub</span>
               </div>
            </div>
         </div>
      </div>

      {/* Warning Box */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
         <div className="bg-slate-900/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl text-right">
            <div className="space-y-1">
               <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Travel Risks / Road Warnings</span>
               <div className="flex flex-col items-end gap-1 mt-2">
                  {risks.length > 0 ? risks.slice(0, 2).map((r, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-900/30 text-red-500 text-[7px] font-black uppercase border border-red-900/50">
                       ! {r}
                    </span>
                  )) : (
                    <span className="text-[7px] font-black uppercase text-agri-500">No major hazards detected</span>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-5">
         <div className="w-full h-1 bg-white animate-scan"></div>
      </div>
    </div>
  );
};

export default RouteVisualizer;
