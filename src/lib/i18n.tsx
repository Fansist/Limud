/**
 * LIMUD v10.0 — Internationalization (i18n)
 * Lightweight cookie-based locale system with 3 languages.
 * Does NOT replace the Edge middleware — works alongside it.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Locale types
export type Locale = 'en' | 'he' | 'es';
export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl'; flag: string }[] = [
  { code: 'en', label: 'English', dir: 'ltr', flag: '🇺🇸' },
  { code: 'he', label: 'עברית', dir: 'rtl', flag: '🇮🇱' },
  { code: 'es', label: 'Español', dir: 'ltr', flag: '🇪🇸' },
];

// Type-safe message structure
type Messages = Record<string, Record<string, string>>;

// Pre-loaded messages (tree-shaking friendly)
import enMessages from '../../messages/en.json';
import heMessages from '../../messages/he.json';
import esMessages from '../../messages/es.json';

const ALL_MESSAGES: Record<Locale, Messages> = {
  en: enMessages,
  he: heMessages,
  es: esMessages,
};

// Context
interface I18nContextType {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  dir: 'ltr',
  setLocale: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Read locale from cookie on mount
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('limud-locale='))
      ?.split('=')[1] as Locale | undefined;

    if (cookieLocale && ALL_MESSAGES[cookieLocale]) {
      setLocaleState(cookieLocale);
      applyLocale(cookieLocale);
    }
  }, []);

  const applyLocale = (loc: Locale) => {
    const localeConfig = LOCALES.find(l => l.code === loc);
    if (localeConfig) {
      document.documentElement.lang = loc;
      document.documentElement.dir = localeConfig.dir;
    }
  };

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `limud-locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    applyLocale(newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    // key format: "section.key" e.g. "common.save"
    const [section, ...rest] = key.split('.');
    const msgKey = rest.join('.');
    const messages = ALL_MESSAGES[locale];
    return messages?.[section]?.[msgKey] || ALL_MESSAGES.en?.[section]?.[msgKey] || key;
  }, [locale]);

  const dir = LOCALES.find(l => l.code === locale)?.dir || 'ltr';

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslation() {
  const { t, locale, dir } = useI18n();
  return { t, locale, dir };
}
