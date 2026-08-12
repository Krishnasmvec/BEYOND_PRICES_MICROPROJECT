/** ₹1,23,456 — Indian lakh/crore digit grouping, not the Western 123,456 grouping toLocaleString() gives without a locale arg. */
export const formatINR = (amount: number, opts?: { maximumFractionDigits?: number }): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  }).format(amount);

/** Same Indian digit grouping for non-currency counts/quantities/distances. */
export const formatIndianNumber = (n: number): string =>
  new Intl.NumberFormat('en-IN').format(n);

/** "Just now" / "12m ago" / "3h ago" / "2d ago" from an ISO timestamp. */
export const formatRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/** "755 kg" or "2.3 Tons" — switches unit above 1,000 kg instead of showing an unwieldy raw kg figure. */
export const formatStockWeight = (kg: number): string => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} Tons`;
  return `${formatIndianNumber(kg)} kg`;
};
