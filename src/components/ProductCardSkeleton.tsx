import React from 'react';

const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white border border-neutral-200 overflow-hidden">
    <div className="aspect-square skeleton-shimmer" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-2/3 skeleton-shimmer rounded" />
      <div className="h-6 w-1/2 skeleton-shimmer rounded" />
      <div className="h-5 w-1/3 skeleton-shimmer rounded-full" />
    </div>
  </div>
);

export default ProductCardSkeleton;
