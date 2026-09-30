import type { ProductAvailability, ProductFreshness } from '../../shared/types.ts';

/** Shared color mapping so MarketCard and ProductCard badges stay visually consistent. */
export const AVAILABILITY_STYLES: Record<ProductAvailability, string> = {
  'High Supply': 'bg-agri-50 text-agri-600 border-agri-100',
  'Medium Supply': 'bg-amber-50 text-amber-700 border-amber-100',
  'Low Supply': 'bg-orange-50 text-orange-700 border-orange-100',
  'Out of Stock': 'bg-red-50 text-red-600 border-red-100',
};

export const FRESHNESS_STYLES: Record<ProductFreshness, string> = {
  'Harvested Today': 'bg-agri-50 text-agri-600 border-agri-100',
  'Harvested Yesterday': 'bg-amber-50 text-amber-700 border-amber-100',
  '2+ Days Old': 'bg-neutral-100 text-neutral-500 border-neutral-200',
};
