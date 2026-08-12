
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { PredictionResult, UserInput, HistoryRecord } from '../types';
import { 
  ArrowLeft, 
  AlertCircle,
  Clock,
  Users,
  Truck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Map as MapIcon,
  Zap,
  ShieldCheck,
  ChevronRight,
  Navigation,
  Target,
  Warehouse,
  HelpCircle,
  ShieldAlert,
  Store,
  FileText,
  History
} from 'lucide-react';
import WeatherCard from './WeatherCard';
import RouteVisualizer from './RouteVisualizer';
import DecisionEngine from './DecisionEngine';
import SDGImpact from './SDGImpact';
import { fetchMarkets, fetchStalls, fetchMe, fetchMyPredictionHistory } from '../lib/api';
import { getGuestId } from '../lib/guestId';
import { formatINR } from '../lib/format';
import StallBookingFlow from './StallBookingFlow';
import LogisticsHUD from './LogisticsHUD';
import StorageAdvisory from './StorageAdvisory';
import VoiceAdvisor from './VoiceAdvisor';
import StrategyReasoning from './StrategyReasoning';
import ResilienceLayer from './ResilienceLayer';
import MarketEthicsCard from './MarketEthicsCard';
import CropStatusMonitor from './CropStatusMonitor';
import CollectiveIntelligenceCard from './CollectiveIntelligenceCard';
import RecordHistory from './RecordHistory';
import FormalReport from './FormalReport';

// recharts is the heaviest dependency this dashboard pulls in — split it
// into its own chunk, loaded only when the Analytics tab is actually opened
// (not the default tab), instead of blocking every dashboard view.
const PriceGraph = lazy(() => import('./PriceGraph'));
const SpoilageChart = lazy(() => import('./SpoilageChart'));
const ProfitTable = lazy(() => import('./ProfitTable'));

const ChartFallback: React.FC = () => (
  <div className="py-16 flex items-center justify-center">
    <Loader2 className="animate-spin text-agri-600" size={24} />
  </div>
);

interface DashboardProps {
  data: PredictionResult;
  input: UserInput;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, input, onReset }) => {
  const [tab, setTab] = useState<'decision' | 'analytics' | 'logistics' | 'records'>('decision');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [isBookingFlowOpen, setIsBookingFlowOpen] = useState(false);
  const [occupancyData, setOccupancyData] = useState({ available: 0, total: 0, rate: 0 });
  const [marketId, setMarketId] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [serverHistory, setServerHistory] = useState<HistoryRecord[] | null>(null);

  // Predictions made while browsing anonymously (the common case — auth is
  // only required at booking time) fall back to this browser's localStorage,
  // keyed by a guest id. Once a farmer signs in (during booking), predictions
  // start being saved server-side too and the "records" tab below prefers
  // that real, cross-device history instead.
  const farmerId = getGuestId();

  useEffect(() => {
    fetchMe()
      .then(async () => {
        setIsSignedIn(true);
        const records = await fetchMyPredictionHistory();
        setServerHistory(records);
      })
      .catch(() => setIsSignedIn(false));
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('harvest_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save current decision to history (only once when data loads)
  useEffect(() => {
    if (data && input && !currentRecordId) {
      const saved = localStorage.getItem('harvest_history');
      const records: HistoryRecord[] = saved ? JSON.parse(saved) : [];

      const isNew = !records.find(r =>
        r.input.location === input.location &&
        r.input.cropType === input.cropType &&
        (Date.now() - r.timestamp < 300000)
      );

      if (isNew) {
        const newId = Math.random().toString(36).substr(2, 9);
        const newRecord: HistoryRecord = {
          id: newId,
          farmerId,
          timestamp: Date.now(),
          input,
          prediction: data,
          status: 'Pending'
        };
        const updated = [...records, newRecord];
        setHistory(updated);
        setCurrentRecordId(newId);
        localStorage.setItem('harvest_history', JSON.stringify(updated));
      } else {
        const existing = records.find(r =>
          r.input.location === input.location && r.input.cropType === input.cropType
        );
        if (existing) setCurrentRecordId(existing.id);
      }
    }
  }, [data, input, currentRecordId]);

  // Look up real market/stall occupancy from the backend instead of a
  // client-side mock array that re-randomized on every page load.
  useEffect(() => {
    if (!data.best_market) return;
    let cancelled = false;

    (async () => {
      try {
        const markets = await fetchMarkets();
        const market = markets.find(m => m.name === data.best_market) ?? markets.find(m => m.id === 'm4') ?? markets[0];
        if (!market || cancelled) return;

        setMarketId(market.id);
        const stalls = await fetchStalls(market.id);
        if (cancelled) return;

        const total = stalls.length;
        const booked = stalls.filter(s => s.status === 'booked').length;
        const available = total - booked;
        const rate = total > 0 ? Math.round((booked / total) * 100) : 0;
        setOccupancyData({ available, total, rate });
      } catch (err) {
        console.error('Failed to load market occupancy:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [data.best_market]);

  const handleUpdateCurrentRecord = (status: 'Completed' | 'Pending' | 'Cancelled', actualPrice?: number) => {
    if (!currentRecordId) return;

    const updatedHistory = history.map(r => {
      if (r.id === currentRecordId) {
        return { 
          ...r, 
          status, 
          prediction: actualPrice ? { ...r.prediction, actual_profit: actualPrice } : r.prediction 
        };
      }
      return r;
    });

    setHistory(updatedHistory);
    localStorage.setItem('harvest_history', JSON.stringify(updatedHistory));
  };

  const handleRecordSelect = (record: HistoryRecord) => {
    setSelectedRecord(record);
  };

  if (selectedRecord) {
    return (
      <div className="max-w-[1200px] mx-auto py-12 px-6 space-y-12 animate-fade-in">
        <button 
          onClick={() => setSelectedRecord(null)}
          className="mono-label text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to Records
        </button>
        <FormalReport record={selectedRecord} />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-32 animate-fade-in space-y-12 px-6 relative">
      
      <VoiceAdvisor data={data} />

      <StallBookingFlow 
        isOpen={isBookingFlowOpen}
        onClose={() => setIsBookingFlowOpen(false)}
        predictionData={data}
        userInput={input}
        preLoadedMarketId={marketId}
        preLoadedOccupancy={occupancyData}
      />

      {data.sell_now_override && (
        <div className="bg-red-600 text-white p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-pulse">
           <div className="flex items-center gap-4">
              <Zap size={32} className="fill-current" />
              <div>
                 <h2 className="text-2xl font-display font-black uppercase tracking-tighter">Emergency: Sell Now</h2>
                 <p className="text-xs font-bold uppercase tracking-widest opacity-80">Crops are decaying fast. Don't wait for a better price.</p>
              </div>
           </div>
           <button className="bg-white text-red-600 px-10 py-4 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-neutral-100 transition-all">
              Go to nearest market <ChevronRight size={18} />
           </button>
        </div>
      )}

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-neutral-200 pb-12 gap-8">
        <div className="space-y-4">
          <button onClick={onReset} className="mono-label text-neutral-400 hover:text-agri-600 transition-colors flex items-center gap-2">
            <ArrowLeft size={12} /> Start Over
          </button>
          <div className="flex items-center gap-4">
             <h2 className="text-5xl font-display font-black tracking-tighter text-neutral-900 uppercase leading-none">
               {input.cropType} <span className="text-neutral-300">/</span> {input.location}
             </h2>
          </div>
        </div>
        
        <div className="flex bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
          {[
            { id: 'decision', icon: Activity, label: 'Today\'s Plan' },
            { id: 'analytics', icon: BarChart3, label: 'Market Logic' },
            { id: 'logistics', icon: MapIcon, label: 'Travel Details' },
            { id: 'records', icon: History, label: 'My Records' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <CropStatusMonitor 
        data={data.status_monitor} 
        expectedProfit={data.expected_profit} 
        onUpdateRecord={handleUpdateCurrentRecord}
      />

      <div className={tab === 'decision' ? 'block' : 'hidden'}>
        <div className="space-y-12">
          <DecisionEngine data={data} />
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 h-full space-y-10">
               <StrategyReasoning data={data.strategy_breakdown} />
               <CollectiveIntelligenceCard data={data.collective_intelligence} />
            </div>
            <div className="lg:col-span-8 space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                 <MarketEthicsCard data={data.market_ethics} />
                 <div className="space-y-10">
                    <WeatherCard data={data.weather} />
                    <SDGImpact impact={data.sdg_impact} />
                 </div>
              </div>

              <div className="bg-white border border-neutral-200 p-12 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-10 border-b border-neutral-100 pb-8">
                    <div className="space-y-1">
                       <p className="mono-label text-neutral-400">Current Market Price</p>
                       <div className="text-4xl font-display font-black text-neutral-900">
                          {formatINR(data.current_mandi_price)} <span className="text-lg text-neutral-400">/ {input.quantityUnit}</span>
                       </div>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="mono-label text-neutral-400">Status</p>
                       <div className="text-xl font-black uppercase text-agri-600 flex items-center justify-end gap-2">
                          <Target size={20} /> Ready to Sell
                       </div>
                    </div>
                 </div>

                 <div className={`p-8 border-l-8 flex flex-col md:flex-row justify-between items-center gap-6 ${data.current_mandi_price < data.min_safe_price ? 'bg-red-50 border-red-500' : 'bg-agri-50 border-agri-600'}`}>
                   <div className="space-y-1">
                      <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                         <AlertCircle size={20} className={data.current_mandi_price < data.min_safe_price ? 'text-red-600' : 'text-agri-600'} />
                         Travel Update / Freshness
                      </h4>
                      <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                         Arrival: {data.logistics.estimated_arrival} | Expected Freshness Loss: {data.logistics.transit_quality_loss}%
                      </p>
                   </div>
                   <div className="text-right">
                      <span className={`text-xs font-black px-6 py-3 uppercase tracking-[0.2em] shadow-lg text-white ${data.current_mandi_price < data.min_safe_price ? 'bg-red-600' : 'bg-agri-900'}`}>
                         Best Path Found
                      </span>
                   </div>
                 </div>
              </div>

              {/* Market Access (Part F) */}
              <div className="bg-white border border-neutral-200 p-12 shadow-sm space-y-8">
                 <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-agri-100 text-agri-600 flex items-center justify-center rounded">
                          <Store size={20} />
                       </div>
                       <div>
                          <h4 className="text-lg font-black uppercase tracking-tight">Market Access Control</h4>
                          <p className="mono-label text-neutral-400">Real-time Stall Availability</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black px-3 py-1 bg-agri-50 text-agri-600 uppercase tracking-widest border border-agri-100">
                          Live Sync Active
                       </span>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <p className="mono-label text-neutral-400">Occupancy</p>
                          <p className="text-xl font-black text-neutral-900">{occupancyData.rate}%</p>
                       </div>
                       <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-agri-600 rounded-full transition-all duration-500" style={{ width: `${occupancyData.rate}%` }}></div>
                       </div>
                       <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          High demand expected at {data.logistics.estimated_arrival}
                       </p>
                    </div>
                    <div className="flex flex-col justify-center items-end gap-2">
                       <p className="mono-label text-neutral-400">Available Slots</p>
                       <p className="text-4xl font-black text-neutral-900">{occupancyData.available}</p>
                    </div>
                 </div>

                 <button 
                    onClick={() => setIsBookingFlowOpen(true)}
                    className="w-full bg-neutral-900 text-white py-5 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-xl"
                 >
                    Reserve Stall Now <ChevronRight size={18} />
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={tab === 'analytics' ? 'block' : 'hidden'}>
        {/* Conditionally mounted (not just CSS-hidden like the other tabs) so
            the lazy-loaded recharts chunk only loads once this tab is opened. */}
        {tab === 'analytics' && (
        <Suspense fallback={<ChartFallback />}>
        <div className="space-y-10">
          <ResilienceLayer data={data.resilience_hub} />
          <div className="grid lg:grid-cols-12 gap-10">
             <div className="lg:col-span-8 space-y-10">
                <div className="bg-white border border-neutral-200 p-12 shadow-sm">
                   <PriceGraph data={data.price_trend} msp={data.min_safe_price} />
                </div>
                <div className="bg-white border border-neutral-200 p-12 shadow-sm">
                   <div className="flex items-center justify-between mb-8">
                      <h4 className="mono-label text-neutral-400">Quality / Freshness Loss Over Time</h4>
                   </div>
                   <div className="h-64"><SpoilageChart data={data.spoilage_curve} /></div>
                </div>
             </div>
             <div className="lg:col-span-4 space-y-10">
                <StorageAdvisory data={data.storage_advisory} />
                <div className="bg-white border border-neutral-200 p-10 space-y-8">
                   <h4 className="mono-label text-neutral-400 flex items-center gap-2"><Users size={16} /> Cooperative Savings</h4>
                   <div className="p-6 bg-agri-50 border border-agri-100">
                      <div className="text-3xl font-black text-agri-900">{formatINR(data.community.potentialCost_saving)}</div>
                      <p className="text-[10px] font-black text-agri-600 uppercase mt-1">Extra money saved by sharing transport</p>
                   </div>
                </div>
                <ProfitTable data={data.profit_forecast} />
             </div>
          </div>
        </div>
        </Suspense>
        )}
      </div>

      <div className={tab === 'logistics' ? 'block' : 'hidden'}>
         <div className="space-y-12">
            <LogisticsHUD data={data.logistics} marketName={data.best_market} />
            <div className="grid lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 border border-neutral-900 p-2 bg-white shadow-2xl">
                  <div className="h-[600px]">
                     <RouteVisualizer 
                       market={data.best_market} 
                       safetyScore={data.route_safety_score} 
                       risks={data.risk_factors} 
                     />
                  </div>
               </div>
               <div className="space-y-10">
                  <div className="bg-white border border-neutral-200 p-8 space-y-6">
                     <h4 className="mono-label text-neutral-400">Road Hazards / Warnings</h4>
                     <div className="space-y-4">
                        {data.risk_factors.map((risk, i) => (
                           <div key={i} className="flex items-center gap-3 p-4 bg-red-50 text-red-700 text-[10px] font-black uppercase border-l-4 border-red-600">
                              <AlertCircle size={14} /> {risk}
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-neutral-900 text-white p-8 space-y-6">
                     <h4 className="mono-label text-agri-400">Back-up Market</h4>
                     <div className="space-y-1">
                        <div className="text-xl font-black uppercase">{data.alternate_market.name}</div>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{data.alternate_market.distance} away</p>
                     </div>
                     <button className="w-full py-4 border border-white/20 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all">
                        Use this Market instead
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className={tab === 'records' ? 'block' : 'hidden'}>
        <div className="max-w-4xl mx-auto space-y-10">
           <div className="bg-white border border-neutral-200 p-12 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-agri-600 text-white flex items-center justify-center rounded shadow-lg">
                    <FileText size={20} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight">Official Paperwork & History</h3>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      {isSignedIn ? 'Synced to your account' : 'Saved on this device — sign in during booking to sync across devices'}
                    </p>
                 </div>
              </div>
              <RecordHistory records={isSignedIn && serverHistory ? serverHistory : history} onSelect={handleRecordSelect} />
           </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
