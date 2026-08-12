
import React from 'react';
import { PriceTrendPoint } from '../types';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

interface PriceGraphProps {
  data: PriceTrendPoint[];
  msp: number;
}

const PriceGraph: React.FC<PriceGraphProps> = ({ data, msp }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
          <TrendingUp size={14} className="text-agri-600" /> 7-Day Market Valuation Forecast
        </h3>
        <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
           <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-neutral-900"></span> Predicted Rate</span>
           <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-red-500 border-t border-dashed border-red-500"></span> Min Safe Price</span>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="day" 
              tick={{fontSize: 9, fill: '#94A3B8', fontWeight: 700}} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{fontSize: 9, fill: '#94A3B8', fontWeight: 700}} 
              axisLine={false}
              tickLine={false}
              unit="₹"
              width={45}
            />
            <Tooltip 
              cursor={{ stroke: '#0F172A', strokeWidth: 1 }}
              contentStyle={{
                borderRadius: '0', 
                border: '1px solid #0F172A', 
                boxShadow: 'none',
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase'
              }}
            />
            
            {/* Loss Prevention Line */}
            <ReferenceLine 
              y={msp} 
              stroke="#EF4444" 
              strokeDasharray="5 5" 
              label={{ 
                position: 'right', 
                value: `MSP: ₹${msp}`, 
                fill: '#EF4444', 
                fontSize: 8, 
                fontWeight: 900 
              }} 
            />

            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#0F172A" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#fff', stroke: '#0F172A', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#166534' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-8 flex items-center gap-3 p-4 bg-neutral-50 border border-neutral-100">
         <Info size={14} className="text-neutral-400" />
         <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
            SYSTEM NOTE: Forecast models are tactical estimates based on mandi-flow indices. 
            The red line indicates your break-even threshold.
         </p>
      </div>
    </div>
  );
};

export default PriceGraph;
