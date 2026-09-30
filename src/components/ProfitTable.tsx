
import React from 'react';
import { DailyProfit } from '../../shared/types.ts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR } from '../lib/format';

interface ProfitTableProps {
  data: DailyProfit[];
}

const ProfitTable: React.FC<ProfitTableProps> = ({ data }) => {
  return (
    <div className="bg-white border border-neutral-200 h-full">
      <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Projection Cycle</h3>
         <TrendingUp size={16} className="text-agri-600" />
      </div>
      <div className="divide-y divide-neutral-100">
        {data.map((item, idx) => {
          const prev = idx > 0 ? data[idx - 1].profit : item.profit;
          const isUp = item.profit >= prev;
          
          return (
            <div key={idx} className="p-6 flex items-center justify-between group hover:bg-neutral-50 transition-colors">
              <div>
                 <div className="text-xs font-bold text-neutral-900 uppercase tracking-tight">{item.day}</div>
                 <div className="text-[10px] font-medium text-neutral-400 mt-0.5">Automated Forecast</div>
              </div>
              <div className="text-right">
                 <div className="text-lg font-black text-neutral-900 number-tabular">{formatINR(item.profit)}</div>
                 <div className={`flex items-center justify-end text-[9px] font-black uppercase mt-1 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                    {isUp ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                    {isUp ? 'Yield Gain' : 'Market Dip'}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfitTable;
