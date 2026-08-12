
import React from 'react';
import { HistoryRecord } from '../types';
import { ShieldCheck, FileText, Download, Printer, Target, MapPin, Scale } from 'lucide-react';
import Logo from './Logo';
import { formatINR } from '../lib/format';

interface FormalReportProps {
  record: HistoryRecord;
}

const FormalReport: React.FC<FormalReportProps> = ({ record }) => {
  const { input, prediction, timestamp } = record;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-neutral-200 shadow-2xl p-16 space-y-12 animate-fade-in print:shadow-none print:border-none print:p-0">
      {/* Report Header */}
      <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-8">
        <div className="flex items-center gap-6">
          <Logo className="w-16 h-16" colorClass="text-neutral-900" />
          <div>
            <h1 className="text-3xl font-display font-black uppercase tracking-tighter leading-none">Official Harvest Plan</h1>
            <p className="mono-label text-[10px] text-neutral-400 mt-2">National Agricultural Intelligence Gateway • Verified Entry</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black uppercase tracking-widest text-neutral-400">Record ID</div>
          <div className="text-lg font-black uppercase tracking-tighter">{record.id.slice(0, 12)}</div>
          <div className="text-[9px] font-bold text-neutral-300 uppercase mt-1">Generated: {new Date(timestamp).toLocaleString()}</div>
        </div>
      </div>

      {/* Body Grid */}
      <div className="grid grid-cols-2 gap-12">
        {/* Left Side: Farmer & Crop Details */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="mono-label text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Scale size={14} /> Commodity Authentication
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-neutral-400">Crop Type</span>
                <p className="text-lg font-black uppercase">{input.cropType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-neutral-400">Quantity</span>
                <p className="text-lg font-black uppercase">{input.quantity} {input.quantityUnit}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-neutral-400">Location Node</span>
                <p className="text-lg font-black uppercase">{input.location}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-neutral-400">Harvest Date</span>
                <p className="text-lg font-black uppercase">{input.harvestDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="mono-label text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Target size={14} /> Tactical Strategy Summary
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border-l-4 border-neutral-900">
                <p className="text-xs font-bold leading-relaxed text-neutral-700 italic">
                  "{prediction.ai_reasoning}"
                </p>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-neutral-400">Confidence Score</span>
                <span className="text-agri-600">{(prediction.confidence_score * 100).toFixed(0)}% AI Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Financial & Market Details */}
        <div className="space-y-8">
           <div className="space-y-4">
            <h3 className="mono-label text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
              <MapPin size={14} /> Recommended Execution
            </h3>
            <div className="p-8 bg-neutral-900 text-white space-y-6">
               <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-neutral-500">Execution Market</span>
                  <div className="text-2xl font-black uppercase">{prediction.best_market}</div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black uppercase text-neutral-500">Date</span>
                     <div className="text-sm font-black uppercase">{prediction.best_day}</div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[9px] font-black uppercase text-neutral-500">Window</span>
                     <div className="text-sm font-black uppercase">{prediction.best_hour_window}</div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="mono-label text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
              <FileText size={14} /> Financial Projection
            </h3>
            <div className="space-y-2">
               <div className="flex justify-between items-end border-b border-neutral-50 py-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Gross Mandi Price</span>
                  <span className="font-black">{formatINR(prediction.current_mandi_price)}</span>
               </div>
               <div className="flex justify-between items-end border-b border-neutral-50 py-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Est. Logistics & Spoilage</span>
                  <span className="font-black text-red-500">-{formatINR(prediction.transport_cost)}</span>
               </div>
               <div className="flex justify-between items-end py-4">
                  <span className="text-xs font-black uppercase">Projected Net Profit</span>
                  <span className="text-2xl font-black">{formatINR(prediction.expected_profit)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="border-t-2 border-neutral-100 pt-8 flex justify-between items-center opacity-60">
        <div className="flex items-center gap-3">
           <ShieldCheck size={20} className="text-agri-600" />
           <p className="text-[9px] font-bold text-neutral-400 uppercase leading-relaxed max-w-md">
             This report is a data-driven tactical recommendation. Final market transaction results may vary based on spot-price volatility and physical quality inspection at point of sale.
           </p>
        </div>
        <div className="text-[8px] font-black uppercase tracking-widest text-neutral-300">
           Part M • Institutional Formalization Layer
        </div>
      </div>

      {/* UI Controls (Hidden on print) */}
      <div className="flex gap-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex-1 py-5 bg-neutral-900 text-white font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-black transition-all"
        >
          <Printer size={16} /> Print Official Document
        </button>
        <button 
          className="flex-1 py-5 border-2 border-neutral-900 text-neutral-900 font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all"
        >
          <Download size={16} /> Export Digital Ledger (JSON)
        </button>
      </div>
    </div>
  );
};

export default FormalReport;
