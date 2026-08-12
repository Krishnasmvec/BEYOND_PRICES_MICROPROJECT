import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from './dictionaries/en';
import hi from './dictionaries/hi';
import { DEFAULT_LANGUAGE } from './languages';
import type { TranslationKey, Dictionary } from './types';

const DICTIONARIES: Record<string, Dictionary> = { en, hi };
const STORAGE_KEY = 'hp_lang';

function resolve(dict: Dictionary, key: string): string {
  const value = key.split('.').reduce<unknown>((acc, part) => (acc as any)?.[part], dict);
  return typeof value === 'string' ? value : key;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? `{{${name}}}`));
}

interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[language] ?? DICTIONARIES[DEFAULT_LANGUAGE];
      return interpolate(resolve(dict, key), vars);
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
