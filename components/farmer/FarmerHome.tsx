import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Clock,
  ChevronRight,
  Sprout,
  TrendingUp,
  MapPin,
  CloudSun,
  Database,
} from 'lucide-react';
import { fetchMyAnalyses, fetchMe } from '../../lib/api';
import type { SavedAnalysis, FarmerProfile } from '../../types';

interface FarmerHomeProps {
  onStartAnalysis: () => void;
}

const FarmerHome: React.FC<FarmerHomeProps> = ({ onStartAnalysis }) => {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(({ farmer }) => {
        setFarmer(farmer);
        return fetchMyAnalyses();
      })
      .then((data) => setAnalyses(data))
      .catch(() => {/* unauthenticated — expected */})
      .finally(() => setLoadingAuth(false));
  }, []);

  const recentAnalyses = analyses.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-8 animate-fade-in">
      
      {/* ── Top Bar (Profile & Status) ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-14">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-agri-900 rounded flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sprout size={22} className="text-white" />
          </div>
          <div>
            {loadingAuth ? (
              <div className="space-y-1.5">
                <div className="h-3 w-16 skeleton-shimmer rounded-sm" />
                <div className="h-4 w-32 skeleton-shimmer rounded-sm" />
              </div>
            ) : farmer ? (
              <div className="animate-slide-in">
                <p className="data-label text-[10px]">Welcome back</p>
                <p className="font-bold text-neutral-900 text-base leading-tight mt-0.5">{farmer.name}</p>
                {(farmer.village || farmer.district) && (
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1 font-medium">
                    <MapPin size={12} className="text-agri-600" />
                    {[farmer.village, farmer.district].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 font-medium">
                Not signed in — sign in during booking to save analyses
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-agri-600 animate-pulse" />
          System active
        </div>
      </div>

      {/* ── Hero Section ────────────────────────────────── */}
      <div className="glass-card rounded-xl overflow-hidden mb-12 shadow-sm border border-neutral-200">
        <div className="bg-gradient-to-r from-agri-50 to-white p-8 md:p-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-agri-100 rounded-full mb-6 shadow-sm">
              <BarChart2 size={12} className="text-agri-600" />
              <span className="data-label !text-agri-900 !tracking-widest">Farmer Decision Support</span>
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl text-neutral-900 tracking-tight leading-[1.1] mb-6">
              Plan your next harvest sale with confidence.
            </h1>
            <p className="text-neutral-600 text-base leading-relaxed mb-10 max-w-lg font-medium">
              Compare top markets using real reference data on prices, transport logistics, and weather to maximize your net return.
            </p>
            <button
              onClick={onStartAnalysis}
              className="action-btn-agri text-sm px-10 py-5 rounded-sm shadow-xl hover:-translate-y-0.5 transition-transform inline-flex font-black tracking-[0.2em]"
            >
              Start Market Analysis <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* ── Left Column: Recent Analyses ────────────────── */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-agri-600" />
                <h3 className="section-heading text-base">Recent Analyses</h3>
              </div>
              <span className="text-xs font-semibold text-neutral-400">Past 30 days</span>
            </div>

            {loadingAuth ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 skeleton-shimmer rounded-sm" />
                ))}
              </div>
            ) : !farmer ? (
              <div className="py-12 text-center bg-neutral-50 rounded-lg border border-neutral-100">
                <Clock size={24} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-500">Sign in to view your history</p>
              </div>
            ) : recentAnalyses.length === 0 ? (
              <div className="py-12 text-center bg-neutral-50 rounded-lg border border-neutral-100">
                <BarChart2 size={24} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-500">No analyses saved yet.</p>
                <p className="text-xs text-neutral-400 mt-1">Run your first analysis to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((a) => (
                  <div key={a.id} className="group flex items-center justify-between p-4 bg-neutral-50 border border-neutral-100 rounded-lg hover:border-agri-200 hover:bg-agri-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-neutral-900 mb-1">{a.topMarketName}</p>
                      <p className="text-xs font-medium text-neutral-500 flex items-center gap-2">
                        <span className="text-neutral-700">{a.input.products.map((p) => p.productName).join(', ')}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300" />
                        {new Date(a.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center justify-center bg-white border border-neutral-200 px-3 py-1.5 rounded shadow-sm">
                        <p className="text-sm font-black text-agri-600">{a.topScore}</p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase ml-1.5 mt-0.5">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Context & Climate ─────────────── */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover-lift">
            <div className="flex items-center gap-2.5 mb-5">
              <TrendingUp size={16} className="text-agri-600" />
              <h3 className="section-heading text-base">How it works</h3>
            </div>
            <ul className="space-y-4">
              {[
                { title: 'Select Products', desc: 'Choose from the catalog & enter quantities.' },
                { title: 'Logistics Details', desc: 'Set farm location & transport preference.' },
                { title: 'Compare Markets', desc: 'View top 3 recommendations based on net return.' }
              ].map((step, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="flex-shrink-0 w-6 h-6 bg-agri-50 text-agri-700 font-bold text-xs flex items-center justify-center rounded-full border border-agri-100">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{step.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 font-medium">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-navy-900 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CloudSun size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-5">
                <Database size={16} className="text-agri-400" />
                <h3 className="font-display font-bold text-sm tracking-widest uppercase text-white/90">Data Sources</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Reference prices & historical trends',
                  'Logistics (distance, time, transport cost)',
                  'Storage advisory per product',
                  'Current climate conditions by district',
                ].map((item, i) => (
                  <p key={i} className="text-sm text-white/80 flex items-start gap-2.5 font-medium">
                    <span className="text-agri-400 mt-1 flex-shrink-0">
                      <ChevronRight size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </p>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-white/10">
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                  Calculations use actual database reference data
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default FarmerHome;

