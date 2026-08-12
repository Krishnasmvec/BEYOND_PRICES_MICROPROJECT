import React from 'react';
import { MapPin, Clock, Package, Users, Star, ChevronRight, ShieldCheck, Navigation } from 'lucide-react';
import { NearbyMarket } from '../types';
import { formatIndianNumber, formatRelativeTime } from '../lib/format';
import { AVAILABILITY_STYLES } from '../lib/badges';

interface MarketCardProps {
  market: NearbyMarket;
  onClick: () => void;
}

const MarketCard: React.FC<MarketCardProps> = ({ market, onClick }) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${market.geo.lat},${market.geo.lng}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="hover-lift w-full text-left bg-neutral-50 border border-neutral-100 p-8 space-y-6 group hover:border-navy-900 hover:bg-white transition-colors relative animate-fade-in cursor-pointer"
    >
      {market.recommended && (
        <div className="badge-pulse absolute -top-3 left-8 inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] shadow-md">
          <Star size={11} className="fill-current" /> Recommended
        </div>
      )}

      <div className="flex justify-between items-start gap-4 pt-2">
        <div className="space-y-1">
          <h4 className="text-2xl font-display font-black text-neutral-900 uppercase tracking-tight leading-tight">
            {market.name}
          </h4>
          <p className="mono-label text-neutral-400">{market.location}</p>
        </div>
        <div className={`shrink-0 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${AVAILABILITY_STYLES[market.availability]}`}>
          {market.availability}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-agri-600">
        <ShieldCheck size={12} />
        <span className="text-[9px] font-bold uppercase tracking-widest">Verified Market Data · Updated {formatRelativeTime(market.lastUpdated)}</span>
      </div>

      <div className="flex items-center gap-6 text-neutral-500">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-agri-600" />
          <span className="text-sm font-bold text-neutral-900">{market.distanceKm} km</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-agri-600" />
          <span className="text-sm font-bold text-neutral-900">~{market.travelTimeMins} min</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
        <div>
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Package size={12} />
            <span className="mono-label">Products</span>
          </div>
          <div className="text-lg font-black text-neutral-900 number-tabular">{formatIndianNumber(market.productCount)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Users size={12} />
            <span className="mono-label">Vendors</span>
          </div>
          <div className="text-lg font-black text-neutral-900 number-tabular">{formatIndianNumber(market.vendorCount)}</div>
        </div>
        {market.logistics.routeStatus && (
          <div>
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <Navigation size={12} />
              <span className="mono-label">Route</span>
            </div>
            <div className="text-[11px] font-black text-neutral-900">{market.logistics.routeStatus}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-navy-900 transition-colors"
        >
          <Navigation size={11} /> Get Directions
        </a>
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-navy-900 group-hover:gap-3 transition-all">
          View Products <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
};

export default MarketCard;
