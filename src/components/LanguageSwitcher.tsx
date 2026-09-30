import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from '../i18n';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
      <Languages size={14} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Select language"
        className="bg-transparent outline-none font-bold uppercase tracking-widest cursor-pointer min-h-[24px]"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
