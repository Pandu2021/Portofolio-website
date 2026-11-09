/**
 * @file pricing-settings.service.ts
 * Pricing settings as a signal, persisted in localStorage and validated when
 * read back (storage is user-controlled input).
 */
import { Injectable, signal } from '@angular/core';
import { DEFAULT_PRICING, isValidPricing, parsePricing, type PricingSettings } from './pricing';

/** localStorage key for the saved settings. */
export const PRICING_STORAGE_KEY = 'dashboard-pricing-v1';

/** Reads saved settings (defaults when missing or invalid). */
export function loadPricing(
  storage: Storage | undefined = globalThis.localStorage,
): PricingSettings {
  try {
    return parsePricing(JSON.parse(storage?.getItem(PRICING_STORAGE_KEY) ?? 'null'));
  } catch {
    return DEFAULT_PRICING;
  }
}

/** Current pricing rules for new orders. */
@Injectable({ providedIn: 'root' })
export class PricingSettingsService {
  readonly settings = signal<PricingSettings>(loadPricing());

  /**
   * Saves valid settings.
   * @returns `false` (and changes nothing) when the values break a rule.
   */
  save(next: PricingSettings): boolean {
    if (!isValidPricing(next)) return false;
    this.settings.set({ ...next });
    try {
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: applies to this visit only.
    }
    return true;
  }

  /** Restores the default rules. */
  reset(): void {
    this.save(DEFAULT_PRICING);
  }
}
