/**
 * @file pricing.ts
 * Price calculation as pure functions (no React, no I/O) so every rule is
 * easy to test. All amounts are whole Indonesian Rupiah.
 *
 * Order of operations: subtotal → promo discount → tax on the discounted
 * amount → delivery fee → total.
 */

/** Demo tax rate (11 %). */
export const TAX_RATE = 0.11;
/** Flat delivery fee. */
export const DELIVERY_FEE = 10_000;
/** Subtotal from which delivery is free. */
export const FREE_DELIVERY_FROM = 150_000;
/** Maximum quantity of one product in the cart. */
export const MAX_QUANTITY = 20;

/** A promo code rule. */
export type Promo =
  | { kind: 'percent'; percent: number; maxDiscount: number; minSubtotal: number }
  | { kind: 'fixed'; amount: number; minSubtotal: number };

/** Demo promo codes (case-insensitive). */
export const PROMOS: Readonly<Record<string, Promo>> = {
  HEMAT10: { kind: 'percent', percent: 10, maxDiscount: 25_000, minSubtotal: 50_000 },
  DEMO20K: { kind: 'fixed', amount: 20_000, minSubtotal: 100_000 },
};

/** Result of checking a promo code. */
export type PromoCheck =
  | { ok: true; code: string; promo: Promo }
  | { ok: false; code: string; reason: 'unknown' | 'minimum'; minSubtotal?: number };

/** One cart line used for pricing. */
export interface PriceLine {
  unitPrice: number;
  quantity: number;
}

/** Every amount shown in the order summary. */
export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  delivery: number;
  total: number;
  /** Outcome of the applied promo code, if any. */
  promo: PromoCheck | null;
}

/** Normalizes user input for promo codes: trimmed and upper-case. */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Sum of unit price × quantity. */
export function subtotalOf(lines: readonly PriceLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

/**
 * Checks whether a promo code exists and applies to this subtotal.
 * @param code - Raw user input.
 * @param subtotal - Cart subtotal in IDR.
 */
export function checkPromo(code: string, subtotal: number): PromoCheck {
  const normalized = normalizePromoCode(code);
  const promo = PROMOS[normalized];
  if (!promo) return { ok: false, code: normalized, reason: 'unknown' };
  if (subtotal < promo.minSubtotal) {
    return { ok: false, code: normalized, reason: 'minimum', minSubtotal: promo.minSubtotal };
  }
  return { ok: true, code: normalized, promo };
}

/** Discount for a valid promo, never more than the subtotal. */
export function discountOf(promo: Promo, subtotal: number): number {
  const raw =
    promo.kind === 'percent'
      ? Math.min(Math.round((subtotal * promo.percent) / 100), promo.maxDiscount)
      : promo.amount;
  return Math.min(raw, subtotal);
}

/**
 * Calculates the full order summary.
 * @param lines - Cart lines.
 * @param promoCode - Applied promo code, or `null`.
 */
export function calculateTotals(lines: readonly PriceLine[], promoCode: string | null): Totals {
  const subtotal = subtotalOf(lines);
  if (subtotal === 0) {
    return { subtotal: 0, discount: 0, tax: 0, delivery: 0, total: 0, promo: null };
  }

  const promo = promoCode ? checkPromo(promoCode, subtotal) : null;
  const discount = promo?.ok ? discountOf(promo.promo, subtotal) : 0;
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { subtotal, discount, tax, delivery, total: subtotal - discount + tax + delivery, promo };
}
