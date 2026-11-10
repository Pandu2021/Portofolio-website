/**
 * @file useI18n.ts
 * Language state shared by the whole app (one module-level ref): saved in
 * localStorage, reflected in `<html lang>`, with formatters for the current
 * language and display currency.
 */
import { computed, ref, watchEffect } from 'vue';
import type { DisplayCurrency } from '../lib/invoice';
import { formatDate, formatMoney, formatPercent, type Locale } from '../lib/format';
import type { BasisPoints, Sen } from '../lib/pricing';
import { MESSAGES } from './messages';

export const LOCALE_STORAGE_KEY = 'invoice-locale';
export const LOCALES: readonly Locale[] = ['en', 'id'];

/** Saved choice → browser language → English. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    // Storage blocked — use the browser language.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('id')
    ? 'id'
    : 'en';
}

const locale = ref<Locale>(detectLocale());

// Keep the document language in sync (screen readers, translation tools).
watchEffect(() => {
  if (typeof document !== 'undefined') document.documentElement.lang = locale.value;
});

/** Access the current language, messages and formatters. */
export function useI18n() {
  const t = computed(() => MESSAGES[locale.value]);

  function setLocale(next: Locale): void {
    locale.value = next;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice applies to this visit only.
    }
  }

  return {
    locale: computed(() => locale.value),
    t,
    setLocale,
    money: (amount: Sen, currency: DisplayCurrency = 'IDR') =>
      formatMoney(amount, locale.value, currency),
    percent: (bp: BasisPoints) => formatPercent(bp, locale.value),
    date: (iso: string) => formatDate(iso, locale.value),
  };
}
