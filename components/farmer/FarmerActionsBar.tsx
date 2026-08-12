import React, { useState } from 'react';
import {
  Navigation,
  Store,
  Truck,
  BookOpen,
  Save,
  BarChart2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { saveAnalysis } from '../../lib/api';
import type { MarketRecommendation, MarketAnalysisInput } from '../../types';

interface FarmerActionsBarProps {
  topRecommendation: MarketRecommendation;
  analysisInput: MarketAnalysisInput;
  onViewRoute: () => void;
  onCompareMarkets: () => void;
  onViewStorage: () => void;
  onViewTransport: () => void;
  onReserveStall: () => void;
}

const FarmerActionsBar: React.FC<FarmerActionsBarProps> = ({
  topRecommendation,
  analysisInput,
  onViewRoute,
  onCompareMarkets,
  onViewStorage,
  onViewTransport,
  onReserveStall,
}) => {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'auth-required'>('idle');

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await saveAnalysis(analysisInput, topRecommendation.marketName, topRecommendation.score);
      setSaveState('saved');
    } catch (err: any) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('authenticated')) {
        setSaveState('auth-required');
      } else {
        setSaveState('error');
      }
      setTimeout(() => setSaveState('idle'), 3500);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-5 border-b border-neutral-100">
        <h4 className="font-bold text-base text-neutral-900">Next Steps</h4>
        <p className="text-xs font-medium text-neutral-400 mt-0.5">Take action on your top recommendation</p>
      </div>

      <div className="p-6 sm:p-8 space-y-4">
        {/* Primary actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onViewRoute}
            className="flex items-center justify-center gap-2.5 px-5 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Navigation size={18} />
            View Route
          </button>
          <button
            onClick={onReserveStall}
            className="flex items-center justify-center gap-2.5 px-5 py-4 bg-agri-600 hover:bg-agri-700 text-white font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Store size={18} />
            Reserve a Stall
          </button>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SecondaryBtn icon={<BarChart2 size={16} />} label="Compare" onClick={onCompareMarkets} />
          <SecondaryBtn icon={<BookOpen size={16} />} label="Storage" onClick={onViewStorage} />
          <SecondaryBtn icon={<Truck size={16} />} label="Transport" onClick={onViewTransport} />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {saveState === 'saving' ? (
              <><Loader2 size={16} className="animate-spin text-neutral-500" /><span>Saving</span></>
            ) : saveState === 'saved' ? (
              <><CheckCircle size={16} className="text-agri-600" /><span className="text-agri-600">Saved</span></>
            ) : (
              <><Save size={16} /><span>Save</span></>
            )}
          </button>
        </div>

        {/* Save feedback */}
        {saveState === 'auth-required' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium animate-fade-in">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <p>Sign in first to save analyses. You can sign in during stall booking.</p>
          </div>
        )}
        {saveState === 'error' && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 font-medium animate-fade-in">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-rose-500" />
            <p>Could not save the analysis. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SecondaryBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 transition-all duration-200 active:scale-95"
  >
    {icon}
    {label}
  </button>
);

export default FarmerActionsBar;
