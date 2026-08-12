
import React from 'react';
import { ShieldCheck, Leaf, Globe, TrendingDown } from 'lucide-react';

interface SDGImpactProps {
  impact: {
    waste_reduction_kg: number;
    primary_sdg: string;
    impact_statement: string;
  };
}

const SDGImpact: React.FC<SDGImpactProps> = ({ impact }) => {
  return (
    <div className="bg-agri-50 border border-agri-200 p-8 space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
         <Globe size={80} />
      </div>
      
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-agri-600 text-white flex items-center justify-center rounded shadow-lg">
            <Leaf size={20} />
         </div>
         <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-agri-600">National Impact Alignment</h4>
            <div className="text-xl font-display font-black text-neutral-900">{impact.primary_sdg}</div>
         </div>
      </div>

      <div className="p-4 bg-white border border-agri-100 flex flex-col gap-1">
         <span className="text-[9px] font-black uppercase text-neutral-400">Waste Prevention Est.</span>
         <div className="text-3xl font-black text-agri-900 number-tabular">
           -{impact.waste_reduction_kg} <span className="text-sm">KG</span>
         </div>
      </div>

      <p className="text-[11px] font-medium leading-relaxed text-neutral-600 italic">
        "{impact.impact_statement}"
      </p>

      <div className="flex items-center gap-2 pt-2">
         <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-agri-900 border-2 border-white"></div>
            <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white"></div>
            <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white"></div>
         </div>
         <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Sustainable Development Verified</span>
      </div>
    </div>
  );
};

export default SDGImpact;
