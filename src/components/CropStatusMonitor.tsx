
import React, { useState, useEffect } from 'react';
import { CropStatusMonitor as StatusType } from '../../shared/types.ts';
import { formatINR } from '../lib/format';
import { 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Clock, 
  ShieldCheck, 
  TrendingUp,
  RotateCcw,
  Target,
  FileText
} from 'lucide-react';

interface CropStatusMonitorProps {
  data: StatusType;
  expectedProfit: number;
  onUpdateRecord?: (status: 'Completed' | 'Pending' | 'Cancelled', actualPrice?: number) => void;
}

const CropStatusMonitor: React.FC<CropStatusMonitorProps> = ({ data, expectedProfit, onUpdateRecord }) => {
  const [actualPrice, setActualPrice] = useState<string>('');
  const [isListed, setIsListed] = useState(data.listing_status === 'Listed');

  const getStatusColor = () => {
    switch (data.current_state) {
      case 'On Track': return 'bg-agri-600 text-white';
      case 'Risk': return 'bg-amber-500 text-white';
      case 'Immediate Action Needed': return 'bg-red-600 text-white';
      default: return 'bg-neutral-400 text-white';
    }
  };

  const getListingColor = () => isListed ? 'text-agri-600 border-agri-600 bg-agri-50' : 'text-neutral-400 border-neutral-200 bg-neutral-50';

  const handleToggleListing = () => {
    const nextState = !isListed;
    setIsListed(nextState);
    if (onUpdateRecord) {
      onUpdateRecord(nextState ? 'Completed' : 'Pending', actualPrice ? Number(actualPrice) : undefined);
    }
  };

  const handlePriceChange = (val: string) => {
    setActualPrice(val);
    if (onUpdateRecord) {
      onUpdateRecord(isListed ? 'Completed' : 'Pending', val ? Number(val) : undefined);
    }
  };

  return (
    <div className="grid lg:grid-cols-4 gap-4 animate-fade-in">
       {/* 1. Overall Status Indicator (Cognitive Relief) */}
       <div className={`p-6 border flex flex-col justify-between ${getStatusColor()} shadow-lg relative overflow-hidden`}>
          <div className="flex items-center gap-2 opacity-50">
             <ShieldCheck size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Global Status</span>
          </div>
          <div className="text-2xl font-display font-black uppercase tracking-tighter leading-tight mt-4">
             {data.current_state}
          </div>
          <div className="mt-4 text-[8px] font-bold uppercase opacity-60 tracking-widest">
             Passive Monitoring Active
          </div>
          <div className="absolute top-0 right-0 p-2 opacity-10">
             <Target size={80} />
          </div>
       </div>

       {/* 2. Listed / Not Listed Status */}
       <div className={`p-6 border-2 flex flex-col justify-between transition-all ${getListingColor()}`}>
          <div className="flex justify-between items-center">
             <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Plan Execution</span>
             {isListed ? <CheckCircle2 size={14} /> : <FileText size={14} />}
          </div>
          <div className="flex items-center gap-2 mt-4">
             <div className={`w-3 h-3 rounded-full ${isListed ? 'bg-agri-600 animate-pulse' : 'bg-neutral-300'}`}></div>
             <span className="text-xl font-black uppercase tracking-tighter">{isListed ? 'LISTED' : 'DRAFT'}</span>
          </div>
          <button 
             onClick={handleToggleListing}
             className={`mt-4 text-[9px] font-black uppercase tracking-widest border-t pt-4 text-center hover:opacity-70 transition-opacity`}
          >
             {isListed ? 'Cancel Plan' : 'Confirm & Execute'}
          </button>
       </div>

       {/* 3. Time Before Loss (Safe Window) */}
       <div className="p-6 border border-neutral-200 bg-white flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
             <Clock size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Safe Window</span>
          </div>
          <div className="mt-4">
             <span className="text-4xl font-display font-black text-neutral-900 tracking-tighter">
                ~{data.safe_window_hours}
             </span>
             <span className="text-sm font-black text-neutral-300 ml-2 uppercase">Hours</span>
          </div>
          <div className="mt-4 text-[8px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
             Before quality grade shift
          </div>
       </div>

       {/* 4. Expected vs Actual Loop */}
       <div className="p-6 border border-neutral-200 bg-white flex flex-col justify-between shadow-sm group">
          <div className="flex items-center gap-2 text-blue-600">
             <TrendingUp size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Reality Loop</span>
          </div>
          <div className="mt-4 space-y-2">
             <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-bold text-neutral-300 uppercase">Expected</span>
                <span className="text-xs font-black text-neutral-400">{formatINR(expectedProfit)}</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-lg font-black text-neutral-900">₹</span>
                <input 
                   type="number" 
                   value={actualPrice}
                   onChange={(e) => handlePriceChange(e.target.value)}
                   placeholder="ACTUAL"
                   className="w-full bg-neutral-50 border-b border-neutral-200 py-1 text-lg font-black outline-none focus:border-blue-600 transition-colors placeholder:text-neutral-100"
                />
             </div>
          </div>
          {actualPrice && (
             <div className="mt-4 text-[8px] font-black text-blue-600 uppercase tracking-widest animate-fade-in">
                Diff: {formatINR(Number(actualPrice) - expectedProfit)}
             </div>
          )}
       </div>
    </div>
  );
};

export default CropStatusMonitor;
