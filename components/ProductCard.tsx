import React, { useState } from 'react';
import { Users, MapPin } from 'lucide-react';
import { MarketProduct } from '../types';
import { formatINR, formatStockWeight, formatRelativeTime } from '../lib/format';
import { AVAILABILITY_STYLES, FRESHNESS_STYLES } from '../lib/badges';
import { CROP_ICONS, findCropIcon, findCropImage } from '../lib/cropIcons';

interface ProductCardProps {
  product: MarketProduct;
  /** The real district/state string of the market this product is listed at — not an invented village name. */
  marketLocation: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, marketLocation }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // product.imageUrl (from Supabase) is the primary, real source. If it's
  // missing or fails to load, fall back to a curated crop photo matched by
  // category/name; if that's not available either, fall to the emoji tile.
  const imageUrl = product.imageUrl || findCropImage(product.category, product.name);
  const iconFallback = findCropIcon(product.category, product.name) || CROP_ICONS[product.name] || '🌿';

  return (
    <div className="hover-lift bg-white border border-neutral-200 overflow-hidden group hover:border-navy-900 transition-colors animate-fade-in">
      <div className="aspect-square relative bg-neutral-50 overflow-hidden">
        {!imgFailed && imageUrl && (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {imageUrl && !imgLoaded && !imgFailed && <div className="absolute inset-0 skeleton-shimmer" />}
        {(!imageUrl || imgFailed) && (
          <div className="absolute inset-0 flex items-center justify-center bg-agri-50">
            <span className="text-6xl" role="img" aria-label={product.name}>{iconFallback}</span>
          </div>
        )}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${FRESHNESS_STYLES[product.freshness]}`}>
          {product.freshnessScore}% Fresh
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-sm font-black text-neutral-900 uppercase tracking-tight">{product.name}</h5>
          <div className={`shrink-0 px-2 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${AVAILABILITY_STYLES[product.availability]}`}>
            {product.availability}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black text-navy-900 number-tabular">{formatINR(product.pricePerUnit)}</span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase">/ {product.unit}</span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-neutral-500 uppercase tracking-widest">Available</span>
          <span className="font-black text-neutral-900">{formatStockWeight(product.quantityAvailable)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest pt-2 border-t border-neutral-100">
          <MapPin size={10} /> Origin: {marketLocation}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          <span className="flex items-center gap-1 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            <Users size={10} /> {product.vendorCount} vendors
          </span>
          <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">Updated {formatRelativeTime(product.lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
