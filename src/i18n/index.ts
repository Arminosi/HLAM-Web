// ============================================================================
// Internationalization (i18n) System
// Lightweight i18n with browser language auto-detection
// ============================================================================

import { create } from 'zustand';
import zh, { type LocaleKeys } from './locales/zh';
import en from './locales/en';

export type Locale = 'zh' | 'en';

const locales: Record<Locale, Record<LocaleKeys, string>> = { zh, en };

/** Detect browser language, default to Chinese */
function detectLocale(): Locale {
  const lang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  // Default to Chinese
  return 'zh';
}

/** Try to load persisted locale from localStorage */
function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem('hlam-locale');
    if (stored === 'zh' || stored === 'en') return stored;
  } catch { /* ignore */ }
  return detectLocale();
}

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    try { localStorage.setItem('hlam-locale', locale); } catch { /* ignore */ }
    set({ locale });
  },
}));

/** Hook to get the translation function */
export function useT() {
  const locale = useI18nStore((s) => s.locale);
  return (key: LocaleKeys): string => {
    return locales[locale]?.[key] ?? locales.zh[key] ?? key;
  };
}

/** Direct access (non-reactive, for use outside React) */
export function t(key: LocaleKeys): string {
  const locale = useI18nStore.getState().locale;
  return locales[locale]?.[key] ?? locales.zh[key] ?? key;
}

export type { LocaleKeys };
