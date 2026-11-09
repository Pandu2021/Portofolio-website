/**
 * @file i18n.service.ts
 * Language state (EN/ID) as signals: stored in localStorage, mirrored to
 * `<html lang>`, with Intl-based formatters for money, numbers and dates.
 */
import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { LOCALE_TAG, MESSAGES, type Locale } from './messages';

/** localStorage key for the chosen language. */
export const LOCALE_STORAGE_KEY = 'dashboard-locale';

/** Initial language: saved choice → browser language → English. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    // Storage blocked — fall back to the browser language.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('id')
    ? 'id'
    : 'en';
}

/** App-wide language service. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);

  /** Current language. */
  readonly locale = signal<Locale>(detectLocale());
  /** Messages for the current language. */
  readonly t = computed(() => MESSAGES[this.locale()]);

  private readonly currency = computed(
    () =>
      new Intl.NumberFormat(LOCALE_TAG[this.locale()], {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }),
  );

  constructor() {
    // Keep the document language in sync (screen readers, translation tools).
    effect(() => {
      this.document.documentElement.lang = LOCALE_TAG[this.locale()];
    });
  }

  /** Switches language and remembers the choice. */
  setLocale(locale: Locale): void {
    this.locale.set(locale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Storage blocked: applies to this visit only.
    }
  }

  /** Whole-rupiah amount, e.g. "Rp 45.000" (ID) or "IDR 45,000" (EN). */
  price(amount: number): string {
    return this.currency().format(amount);
  }

  /** Plain number with grouping, e.g. "100.000" / "100,000". */
  number(value: number, maximumFractionDigits = 0): string {
    return new Intl.NumberFormat(LOCALE_TAG[this.locale()], { maximumFractionDigits }).format(
      value,
    );
  }

  /** Percentage from a ratio, e.g. 0.083 → "8.3%". */
  percent(ratio: number): string {
    return new Intl.NumberFormat(LOCALE_TAG[this.locale()], {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(ratio);
  }

  /** Date and time, e.g. "Nov 9, 14:05". */
  dateTime(iso: string): string {
    return new Intl.DateTimeFormat(LOCALE_TAG[this.locale()], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  /** Short day label for charts from a `YYYY-MM-DD` key, e.g. "Mon 3". */
  day(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Intl.DateTimeFormat(LOCALE_TAG[this.locale()], {
      weekday: 'short',
      day: 'numeric',
    }).format(new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  }
}
