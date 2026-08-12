
import React from 'react';
import { StorageAdvisory as StorageType } from '../types';
import { 
  Warehouse, 
  ThermometerSnowflake, 
  Layers, 
  Wind, 
  Clock, 
  ShieldAlert,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface StorageAdvisoryProps {
  data: StorageType;
}

const StorageAdvisory: React.FC<StorageAdvisoryProps> = ({ data }) => {
  return (
    <div className="bg-white border border-neutral-200 p-8 space-y-8 group relative overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
         <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Warehouse size={14} /> Micro-Preservation Advisory
         </h4>
         <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${data.is_worth_it ? 'text-agri-600' : 'text-red-500'}`}>
            {data.is_worth_it ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {data.is_worth_it ? 'Storage Recommended' : 'Immediate Sale Advised'}
         </div>
      </div>

      <div className="flex-1 space-y-6">
        <p className="text-xl font-light italic leading-relaxed text-neutral-600">
          "{data.reasoning}"
        </p>

        <div className="grid grid-cols-2 gap-4">
           <div className={`p-4 border flex flex-col gap-2 ${data.cooling_advised ? 'bg-blue-50 border-blue-100' : 'bg-neutral-50 border-neutral-100'}`}>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
                 <ThermometerSnowflake size={12} className={data.cooling_advised ? 'text-blue-500' : 'text-neutral-300'} /> Cooling
              </div>
              <span className="text-xs font-black uppercase">{data.cooling_advised ? 'REQUIRED' : 'NOT ESSENTIAL'}</span>
           </div>

           <div className={`p-4 border flex flex-col gap-2 ${data.ventilation_required ? 'bg-agri-50 border-agri-100' : 'bg-neutral-50 border-neutral-100'}`}>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
                 <Wind size={12} className={data.ventilation_required ? 'text-agri-500' : 'text-neutral-300'} /> Air Flow
              </div>
              <span className="text-xs font-black uppercase">{data.ventilation_required ? 'CRITICAL' : 'STANDARD'}</span>
           </div>

           <div className="p-4 border border-neutral-100 bg-neutral-50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
                 <Layers size={12} /> Max Stacking
              </div>
              <span className="text-xs font-black uppercase">{data.stack_height_limit}</span>
           </div>

           <div className="p-4 border border-neutral-100 bg-neutral-50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
                 <Clock size={12} /> Max Safety
              </div>
              <span className="text-xs font-black uppercase">~{data.max_safe_hours} HOURS</span>
           </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-50 flex items-center gap-2 opacity-40">
         <ShieldAlert size={12} className="text-amber-500" />
         <span className="text-[8px] font-black uppercase tracking-[0.2em]">Risk: {data.expected_grade_loss} if limit exceeded</span>
      </div>
    </div>
  );
};

export default StorageAdvisory;
