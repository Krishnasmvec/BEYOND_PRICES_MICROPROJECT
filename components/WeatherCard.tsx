
import React from 'react';
import { WeatherData } from '../types';
import { CloudRain, Thermometer, Wind, Zap, AlertTriangle } from 'lucide-react';

interface WeatherCardProps {
  data: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  return (
    <div className="bg-white border border-neutral-200 p-8 space-y-8 group relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
         <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Environmental Risk</h4>
         <Zap size={14} className="text-amber-500" />
      </div>
      
      <div className="grid grid-cols-2 gap-8 relative z-10">
         <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase">
               <Thermometer size={12} /> Temperature
            </div>
            <div className="text-3xl font-black text-neutral-900">{data.temp}°C</div>
         </div>
         <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase">
               <CloudRain size={12} /> Humidity
            </div>
            <div className="text-3xl font-black text-neutral-900">{data.humidity}%</div>
         </div>
      </div>

      <div className="p-6 bg-amber-50 border-l-4 border-amber-500 space-y-2">
         <div className="flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase">
            <AlertTriangle size={12} /> Spoilage Multiplier
         </div>
         <div className="text-2xl font-black text-amber-900">{data.riskMultiplier}x Normal Decay</div>
         <p className="text-[10px] font-bold text-amber-700/60 uppercase">{data.condition}</p>
      </div>

      <div className="text-[9px] font-black uppercase tracking-widest text-neutral-300">
         Impact: {data.storageImpact}
      </div>
    </div>
  );
};

export default WeatherCard;
