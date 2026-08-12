import React, { useEffect, useState } from 'react';
import { Loader2, Database, Map, TrendingUp, Cloud, Zap } from 'lucide-react';

const STEPS = [
  { label: 'Locating your farm & analyzing logistics...', icon: Map },
  { label: 'Querying real-time market data...', icon: Database },
  { label: 'Fetching current climate conditions...', icon: Cloud },
  { label: 'Evaluating historical price trends...', icon: TrendingUp },
  { label: 'Calculating optimal market returns...', icon: Zap },
];

const STEP_DURATION_MS = 1500;

interface AnalysisLoadingScreenProps {
  /** Pass true while the actual API call is in flight */
  active: boolean;
}

const AnalysisLoadingScreen: React.FC<AnalysisLoadingScreenProps> = ({ active }) => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!active) { setStepIdx(0); return; }
    setStepIdx(0);
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, STEP_DURATION_MS);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex flex-col items-center justify-center py-24 md:py-32 px-8 animate-fade-in w-full max-w-2xl mx-auto">
      {/* Spinner Header */}
      <div className="relative mb-14">
        <div className="w-20 h-20 bg-agri-50 rounded-full flex items-center justify-center shadow-inner border border-agri-100">
          <Loader2 size={32} className="text-agri-600 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-agri-500 animate-spin" style={{ animationDuration: '2s' }}></div>
      </div>

      {/* Progress Box */}
      <div className="w-full bg-white border border-neutral-200 rounded-2xl shadow-sm p-8 mb-8">
        <h3 className="text-center font-display font-bold text-lg text-neutral-900 mb-8">
          Analyzing Market Options
        </h3>
        
        {/* Step messages */}
        <div className="space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isPast = i < stepIdx;
            const isCurrent = i === stepIdx;
            const isFuture = i > stepIdx;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-4 transition-all duration-700 ${
                  isPast
                    ? 'text-agri-600 opacity-60'
                    : isCurrent
                    ? 'text-neutral-900 font-bold transform scale-105 origin-left'
                    : 'text-neutral-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                  isPast ? 'bg-agri-100 text-agri-600' : isCurrent ? 'bg-agri-600 text-white shadow-md animate-pulse' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <Icon size={14} />
                </div>
                <span className="text-sm">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Processing</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-agri-600">
            {Math.round(((stepIdx + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-agri-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.round(((stepIdx + 1) / STEPS.length) * 100)}%` }}
          />
        </div>
        <p className="text-center text-xs font-medium text-neutral-400 mt-4">
          Querying {STEPS.length} data sources securely
        </p>
      </div>
    </div>
  );
};

export default AnalysisLoadingScreen;
