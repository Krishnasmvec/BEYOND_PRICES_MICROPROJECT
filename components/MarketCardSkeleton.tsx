import React from 'react';

const MarketCardSkeleton: React.FC = () => (
  <div className="bg-neutral-50 border border-neutral-100 p-8 space-y-6">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <div className="h-6 w-2/3 skeleton-shimmer rounded" />
        <div className="h-3 w-1/3 skeleton-shimmer rounded" />
      </div>
      <div className="h-6 w-20 skeleton-shimmer rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-10 skeleton-shimmer rounded" />
      <div className="h-10 skeleton-shimmer rounded" />
      <div className="h-10 skeleton-shimmer rounded" />
    </div>
    <div className="h-8 w-1/2 skeleton-shimmer rounded-full" />
  </div>
);

export default MarketCardSkeleton;
