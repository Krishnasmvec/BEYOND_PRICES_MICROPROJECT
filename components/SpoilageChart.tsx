
import React from 'react';
import { SpoilagePoint } from '../types';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid, ReferenceLine } from 'recharts';

interface SpoilageChartProps {
  data: SpoilagePoint[];
}

const SpoilageChart: React.FC<SpoilageChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDecay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="day" 
            tick={{fontSize: 9, fill: '#94A3B8', fontWeight: 700}} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{fontSize: 9, fill: '#94A3B8', fontWeight: 700}} 
            axisLine={false}
            tickLine={false}
            unit="%"
            width={40}
          />
          <Tooltip 
             contentStyle={{
               borderRadius: '0', 
               border: '1px solid #000', 
               fontSize: '10px', 
               fontWeight: 'bold', 
               textTransform: 'uppercase'
             }}
          />
          
          {/* Quality Threshold Line */}
          <ReferenceLine 
            y={15} 
            stroke="#F59E0B" 
            strokeDasharray="4 4" 
            label={{ 
              value: 'Grade B Threshold', 
              position: 'insideBottomRight', 
              fill: '#F59E0B', 
              fontSize: 8, 
              fontWeight: 900 
            }} 
          />

          <Area 
            type="monotone" 
            dataKey="riskPercentage" 
            stroke="#166534" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorDecay)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpoilageChart;
