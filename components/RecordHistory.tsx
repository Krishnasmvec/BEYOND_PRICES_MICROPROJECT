
import React from 'react';
import { HistoryRecord } from '../types';
import { Clock, CheckCircle, XCircle, ArrowRight, FileText, Calendar } from 'lucide-react';
import { formatINR } from '../lib/format';

interface RecordHistoryProps {
  records: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
}

const RecordHistory: React.FC<RecordHistoryProps> = ({ records, onSelect }) => {
  if (records.length === 0) {
    return (
      <div className="p-12 border border-neutral-200 bg-white text-center space-y-4">
        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
          <FileText size={32} />
        </div>
        <div className="space-y-1">
          <h4 className="text-lg font-black uppercase tracking-tight text-neutral-900">No Records Found</h4>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Your selling decisions will appear here automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="mono-label text-neutral-400 flex items-center gap-2">
          <Calendar size={14} /> Decision History & Archive
        </h3>
        <span className="text-[10px] font-black uppercase text-agri-600 bg-agri-50 px-2 py-0.5 border border-agri-100">
          Digital Proof Enabled
        </span>
      </div>

      <div className="grid gap-4">
        {records.sort((a, b) => b.timestamp - a.timestamp).map((record) => (
          <div 
            key={record.id}
            onClick={() => onSelect(record)}
            className="group bg-white border border-neutral-200 p-6 flex items-center justify-between hover:border-agri-600 cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <span className="text-lg font-black">{record.input.cropType[0]}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black uppercase text-neutral-900 tracking-tight">{record.input.cropType}</h4>
                  <span className="text-[8px] font-black px-2 py-0.5 bg-neutral-100 text-neutral-400 uppercase">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase">
                  {record.input.quantity} {record.input.quantityUnit} • {record.prediction.best_market}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-sm font-black text-neutral-900">{formatINR(record.prediction.expected_profit)}</div>
                <div className={`text-[8px] font-black uppercase tracking-widest flex items-center justify-end gap-1 ${
                  record.status === 'Completed' ? 'text-agri-600' : record.status === 'Cancelled' ? 'text-red-500' : 'text-neutral-400'
                }`}>
                  {record.status === 'Completed' ? <CheckCircle size={8} /> : record.status === 'Cancelled' ? <XCircle size={8} /> : <Clock size={8} />}
                  {record.status}
                </div>
              </div>
              <ArrowRight size={16} className="text-neutral-200 group-hover:text-agri-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordHistory;
