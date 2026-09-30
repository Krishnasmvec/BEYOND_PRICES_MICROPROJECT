
import React from 'react';

const Logo: React.FC<{ className?: string; colorClass?: string }> = ({ className = "w-8 h-8", colorClass = "text-agri-600" }) => {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M16 2L16 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={colorClass} />
      <path d="M4 10L16 2L28 10V22L16 30L4 22V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={colorClass} />
      <path d="M16 8C16 8 20 12 20 16C20 20 16 24 16 24C16 24 12 20 12 16C12 12 16 8 16 8Z" fill="currentColor" className={colorClass} fillOpacity="0.2" />
      <circle cx="16" cy="16" r="2" fill="currentColor" className={colorClass} />
    </svg>
  );
};

export default Logo;
