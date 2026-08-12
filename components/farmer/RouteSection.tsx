import React from 'react';
import { MapPin, Clock, Navigation, AlertCircle, ArrowDown } from 'lucide-react';
import type { MarketRecommendation } from '../../types';

interface RouteSectionProps {
  recommendation: MarketRecommendation;
  farmerLocation: string;
}

const RouteSection: React.FC<RouteSectionProps> = ({ recommendation: rec, farmerLocation }) => {
  const logistics = rec.logistics;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-5 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation size={18} className="text-agri-600" />
          <h4 className="font-bold text-base text-neutral-900">Route Information</h4>
        </div>
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-neutral-100 text-neutral-500 rounded border border-neutral-200">
          Database Logistics
        </span>
      </div>

      <div className="px-6 sm:px-8 py-6 sm:py-8">
        {/* Origin → Destination */}
        <div className="flex items-stretch gap-5 mb-8">
          {/* Visual connector */}
          <div className="flex flex-col items-center gap-0 pt-1 flex-shrink-0">
            <div className="w-4 h-4 rounded-full border-2 border-agri-600 bg-white ring-4 ring-agri-50" />
            <div className="w-0.5 flex-1 bg-gradient-to-b from-agri-300 to-neutral-200 my-1" style={{ minHeight: 36 }} />
            <ArrowDown size={14} className="text-agri-500" />
            <MapPin size={18} className="text-agri-600 -mt-1" />
          </div>

          {/* Location labels */}
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Your Farm</p>
              <p className="text-base font-black text-neutral-900">
                {farmerLocation || 'Location not specified'}
              </p>
            </div>
            <div className="p-4 bg-agri-50 rounded-xl border border-agri-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-agri-600/70 mb-1">Destination Market</p>
              <p className="text-base font-black text-neutral-900">{rec.marketName}</p>
              <p className="text-sm font-medium text-neutral-500 mt-0.5">
                {rec.district}{rec.state ? `, ${rec.state}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Distance"
            value={`${rec.distanceKm} km`}
            note="Calculated"
            icon={<Navigation size={14} className="text-agri-500" />}
          />
          <StatCard
            label="Travel Time"
            value={`${rec.travelTimeMins} min`}
            note="Estimated"
            icon={<Clock size={14} className="text-neutral-400" />}
          />
          <StatCard
            label="Route Status"
            value={logistics.routeStatus ?? null}
            note="Database"
          />
          <StatCard
            label="Road Condition"
            value={logistics.roadCondition ?? null}
            note="Database"
          />
        </div>

        {/* Map placeholder */}
        <div className="border border-dashed border-neutral-200 rounded-xl bg-neutral-50/80 h-44 flex flex-col items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
            <Navigation size={22} className="text-neutral-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-neutral-400">Interactive Route Map</p>
            <p className="text-xs text-neutral-300 mt-1 px-8">
              Map integration pending. Distance and travel time are calculated from GPS coordinates.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-100 text-sm text-neutral-500 font-medium">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-neutral-400" />
          <p>
            Live traffic data is not available. Route status and road condition are sourced from the
            regional logistics database — not a real-time routing service.
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | null;
  note: string;
  icon?: React.ReactNode;
}> = ({ label, value, note, icon }) => (
  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
    </div>
    {value != null ? (
      <p className="text-sm font-black text-neutral-900">{value}</p>
    ) : (
      <p className="text-xs font-medium text-neutral-400">Unavailable</p>
    )}
    <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 mt-1">{note}</p>
  </div>
);

export default RouteSection;
