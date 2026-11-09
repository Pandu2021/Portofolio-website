/**
 * @file I18nContext.tsx
 * Language state (EN/ID): stored in localStorage, reflected in `<html lang>`,
 * and exposed with a price formatter for the current language.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LOCALE_TAG, MESSAGES, type Locale, type Messages } from './messages';

/** localStorage key for the chosen language. */
export const LOCALE_STORAGE_KEY = 'storefront-locale';

interface I18nValue {
  locale: Locale;
  /** Messages for the current language. */
  t: Messages;
  setLocale: (locale: Locale) => void;
  /** Formats whole Rupiah, e.g. "Rp 28.000" (ID) or "IDR 28,000" (EN). */
  formatPrice: (amount: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Initial language: saved choice → browser language → English. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    // Storage blocked — fall through to the browser language.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('id')
    ? 'id'
    : 'en';
}

/** Provides language state to the app. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  // Keep the document language in sync (screen readers, translation tools).
  useEffect(() => {
    document.documentElement.lang = LOCALE_TAG[locale];
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const currency = new Intl.NumberFormat(LOCALE_TAG[locale], {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    });
    return {
      locale,
      t: MESSAGES[locale],
      setLocale: (next) => {
        setLocaleState(next);
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, next);
        } catch {
          // Storage blocked: the choice applies to this visit only.
        }
      },
      formatPrice: (amount) => currency.format(amount),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Access the current language, messages and formatters. */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
