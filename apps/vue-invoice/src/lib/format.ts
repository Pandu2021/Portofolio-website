/**
 * @file format.ts
 * Display formatting for amounts, percentages and dates (Intl, no libraries).
 * Calculations always stay in rupiah (sen); USD is a DISPLAY option only,
 * converted with a fixed demo rate that the page labels as "demo".
 */
import type { DisplayCurrency } from './invoice';
import type { BasisPoints, Sen } from './pricing';

export type Locale = 'en' | 'id';
export const LOCALE_TAG: Record<Locale, string> = { en: 'en-US', id: 'id-ID' };

/** Fixed demo exchange rate: Rp 16 000 = USD 1 (not a market rate). */
export const DEMO_USD_RATE = 16_000;

const cache = new Map<string, Intl.NumberFormat>();
function numberFormat(tag: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${tag}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    format = new Intl.NumberFormat(tag, options);
    cache.set(key, format);
  }
  return format;
}

/**
 * Formats an amount in sen.
 * - IDR: whole rupiah, or two decimals when there are sen ("Rp 1.234,56").
 * - USD: converted at {@link DEMO_USD_RATE}, always two decimals.
 */
export function formatMoney(
  amount: Sen,
  locale: Locale,
  currency: DisplayCurrency = 'IDR',
): string {
  const tag = LOCALE_TAG[locale];
  if (currency === 'USD') {
    const dollars = amount / 100 / DEMO_USD_RATE;
    return numberFormat(tag, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  }
  const digits = amount % 100 === 0 ? 0 : 2;
  return numberFormat(tag, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 100);
}

/** Formats basis points as a percentage, e.g. 1 100 → "11%" / "11%", 250 → "2.5%". */
export function formatPercent(bp: BasisPoints, locale: Locale): string {
  return numberFormat(LOCALE_TAG[locale], { style: 'percent', maximumFractionDigits: 2 }).format(
    bp / 10_000,
  );
}

/** Formats an ISO date (YYYY-MM-DD) as "10 Nov 2026" / "Nov 10, 2026" (UTC, no shift). */
export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
