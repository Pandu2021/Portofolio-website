/**
 * @file pricing.test.ts
 * Every pricing rule: subtotal, promo validation, discount caps, tax on the
 * discounted amount, free delivery threshold and total.
 */
import { describe, expect, it } from 'vitest';
import {
  calculateTotals,
  checkPromo,
  DELIVERY_FEE,
  discountOf,
  FREE_DELIVERY_FROM,
  normalizePromoCode,
  PROMOS,
  subtotalOf,
} from './pricing';

const lines = (...amounts: [number, number][]) =>
  amounts.map(([unitPrice, quantity]) => ({ unitPrice, quantity }));

describe('pricing', () => {
  it('sums unit price × quantity', () => {
    expect(subtotalOf(lines([28_000, 2], [26_000, 1]))).toBe(82_000);
    expect(subtotalOf([])).toBe(0);
  });

  it('normalizes promo codes', () => {
    expect(normalizePromoCode('  hemat10 ')).toBe('HEMAT10');
  });

  it('validates promo codes: unknown, minimum not met, valid', () => {
    expect(checkPromo('nope', 500_000)).toMatchObject({ ok: false, reason: 'unknown' });
    expect(checkPromo('hemat10', 40_000)).toMatchObject({
      ok: false,
      reason: 'minimum',
      minSubtotal: 50_000,
    });
    expect(checkPromo('HEMAT10', 60_000)).toMatchObject({ ok: true, code: 'HEMAT10' });
  });

  it('caps percentage discounts and never exceeds the subtotal', () => {
    const percent = PROMOS['HEMAT10'];
    if (!percent) throw new Error('HEMAT10 promo missing');
    expect(discountOf(percent, 100_000)).toBe(10_000);
    expect(discountOf(percent, 900_000)).toBe(25_000); // capped
    expect(discountOf({ kind: 'fixed', amount: 50_000, minSubtotal: 0 }, 30_000)).toBe(30_000);
  });

  it('calculates tax on the discounted amount and adds delivery below the threshold', () => {
    const totals = calculateTotals(lines([30_000, 2]), 'HEMAT10'); // 60.000
    expect(totals.subtotal).toBe(60_000);
    expect(totals.discount).toBe(6_000);
    expect(totals.tax).toBe(Math.round(54_000 * 0.11)); // 5.940
    expect(totals.delivery).toBe(DELIVERY_FEE);
    expect(totals.total).toBe(60_000 - 6_000 + 5_940 + DELIVERY_FEE);
  });

  it('gives free delivery from the threshold', () => {
    const totals = calculateTotals(lines([FREE_DELIVERY_FROM, 1]), null);
    expect(totals.delivery).toBe(0);
  });

  it('ignores a promo that no longer meets its minimum', () => {
    const totals = calculateTotals(lines([20_000, 1]), 'DEMO20K');
    expect(totals.discount).toBe(0);
    expect(totals.promo).toMatchObject({ ok: false, reason: 'minimum' });
  });

  it('returns zeros for an empty cart', () => {
    expect(calculateTotals([], 'HEMAT10')).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      delivery: 0,
      total: 0,
      promo: null,
    });
  });
});
