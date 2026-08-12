
import React from 'react';
import { Database, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { useTranslation } from '../i18n';

interface RoleSelectorProps {
  onSelect: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter text-neutral-900 uppercase">
          Harvest<span className="text-agri-600">Planner</span>
        </h1>
        <p className="mono-label text-neutral-400 tracking-[0.4em]">{t('roleSelector.tagline')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Farmer Entry: Earthy/Warm */}
        <button
          onClick={() => onSelect('farmer')}
          className="group relative bg-white border-2 border-neutral-100 p-12 text-left transition-all hover:border-agri-600 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 group-hover:bg-amber-100"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-agri-900 text-white flex items-center justify-center mb-8 shadow-lg group-hover:-translate-y-2 transition-transform">
              <Database size={32} />
            </div>
            <h2 className="text-4xl font-display font-black mb-4 tracking-tighter uppercase text-neutral-900">{t('roleSelector.farmerTitle')}</h2>
            <p className="text-neutral-500 font-medium leading-relaxed mb-8 text-lg">
              {t('roleSelector.farmerDesc')}
            </p>
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-agri-600 group-hover:gap-6 transition-all">
              {t('roleSelector.farmerCta')} <ArrowRight size={20} />
            </div>
          </div>
        </button>

        {/* Consumer Entry: Navy/Steel */}
        <button
          onClick={() => onSelect('consumer')}
          className="group relative bg-white border-2 border-neutral-100 p-12 text-left transition-all hover:border-navy-900 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 group-hover:bg-neutral-100"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-navy-900 text-white flex items-center justify-center mb-8 shadow-lg group-hover:-translate-y-2 transition-transform">
              <Globe size={32} />
            </div>
            <h2 className="text-4xl font-display font-black mb-4 tracking-tighter uppercase text-neutral-900">{t('roleSelector.consumerTitle')}</h2>
            <p className="text-neutral-500 font-medium leading-relaxed mb-8 text-lg">
              {t('roleSelector.consumerDesc')}
            </p>
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-navy-900 group-hover:gap-6 transition-all">
              {t('roleSelector.consumerCta')} <ArrowRight size={20} />
            </div>
          </div>
        </button>
      </div>

      {/* Trust Signals */}
      <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-40">
        <div className="flex items-center gap-3 mono-label text-[9px]">
          <ShieldCheck size={14} /> {t('roleSelector.trustPrivacy')}
        </div>
        <div className="flex items-center gap-3 mono-label text-[9px]">
          <ShieldCheck size={14} /> {t('roleSelector.trustSource')}
        </div>
        <div className="flex items-center gap-3 mono-label text-[9px]">
          <ShieldCheck size={14} /> {t('roleSelector.trustNoMiddlemen')}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
