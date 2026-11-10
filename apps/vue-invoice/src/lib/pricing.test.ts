/**
 * @file pricing.test.ts
 * The pricing engine: every step, both tax modes, rounding, discount caps,
 * invalid input and very large numbers. Amounts are in sen (Rp 1 = 100).
 */
import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  assertSettings,
  calculateTotals,
  invoiceDiscount,
  lineTotal,
  mulDivRound,
  percentToBp,
  roundToStep,
  rupiahToSen,
  tryCalculateTotals,
  type LineInput,
  type PricingSettings,
} from './pricing';

const rp = (rupiah: number) => rupiah * 100;
const exclusive: PricingSettings = {
  taxRateBp: 1_100,
  serviceFeeBp: 0,
  taxMode: 'exclusive',
  roundingStep: 1,
};
const line = (quantity: number, unitRupiah: number, discountBp = 0): LineInput => ({
  quantity,
  unitPrice: rp(unitRupiah),
  discountBp,
});
const noDiscount = { type: 'percent', value: 0 } as const;

describe('mulDivRound', () => {
  it('rounds half up and is exact', () => {
    expect(mulDivRound(5, 1, 10)).toBe(1); // 0.5 → 1
    expect(mulDivRound(4, 1, 10)).toBe(0); // 0.4 → 0
    expect(mulDivRound(1_000, 1_100, 10_000)).toBe(110);
  });

  it('handles products beyond Number.MAX_SAFE_INTEGER exactly (BigInt)', () => {
    const big = 900_000_000_000_000; // 9e14
    expect(mulDivRound(big, 9_999, 10_000)).toBe(899_910_000_000_000);
  });

  it('rejects division by zero and unsafe results', () => {
    expect(() => mulDivRound(1, 1, 0)).toThrow(RangeError);
    expect(() => mulDivRound(Number.MAX_SAFE_INTEGER, 10, 1)).toThrow(RangeError);
  });
});

describe('lineTotal', () => {
  it('multiplies quantity and unit price', () => {
    expect(lineTotal(line(3, 25_000))).toBe(rp(75_000));
  });

  it('applies the line discount and rounds to the nearest sen', () => {
    expect(lineTotal(line(1, 10_000, 1_250))).toBe(rp(8_750)); // 12.5 %
    expect(lineTotal({ quantity: 1, unitPrice: 333, discountBp: 5_000 })).toBe(167); // 166.5 → 167
  });

  it('allows a free item (price 0) and a 100 % discount', () => {
    expect(lineTotal(line(2, 0))).toBe(0);
    expect(lineTotal(line(2, 50_000, 10_000))).toBe(0);
  });

  it.each([
    ['zero quantity', { quantity: 0, unitPrice: 100, discountBp: 0 }],
    ['negative quantity', { quantity: -1, unitPrice: 100, discountBp: 0 }],
    ['fractional quantity', { quantity: 1.5, unitPrice: 100, discountBp: 0 }],
    ['too many units', { quantity: LIMITS.maxQuantity + 1, unitPrice: 100, discountBp: 0 }],
    ['negative price', { quantity: 1, unitPrice: -100, discountBp: 0 }],
    ['fractional sen', { quantity: 1, unitPrice: 10.5, discountBp: 0 }],
    ['price above the limit', { quantity: 1, unitPrice: LIMITS.maxUnitPrice + 1, discountBp: 0 }],
    ['negative discount', { quantity: 1, unitPrice: 100, discountBp: -1 }],
    ['discount above 100 %', { quantity: 1, unitPrice: 100, discountBp: 10_001 }],
    ['NaN', { quantity: Number.NaN, unitPrice: 100, discountBp: 0 }],
  ])('rejects %s', (_label, input) => {
    expect(() => lineTotal(input)).toThrow(RangeError);
  });
});

describe('invoiceDiscount', () => {
  it('takes a percentage of the subtotal', () => {
    expect(invoiceDiscount(rp(200_000), { type: 'percent', value: 1_000 })).toEqual({
      amount: rp(20_000),
      capped: false,
    });
  });

  it('takes a fixed amount', () => {
    expect(invoiceDiscount(rp(200_000), { type: 'amount', value: rp(15_000) })).toEqual({
      amount: rp(15_000),
      capped: false,
    });
  });

  it('never discounts more than the subtotal (and reports the cap)', () => {
    expect(invoiceDiscount(rp(50_000), { type: 'amount', value: rp(80_000) })).toEqual({
      amount: rp(50_000),
      capped: true,
    });
  });

  it('rejects negative or out-of-range discounts', () => {
    expect(() => invoiceDiscount(100, { type: 'amount', value: -1 })).toThrow(RangeError);
    expect(() => invoiceDiscount(100, { type: 'percent', value: 10_001 })).toThrow(RangeError);
  });
});

describe('roundToStep', () => {
  it('rounds to the nearest rupiah', () => {
    expect(roundToStep(12_349, 1)).toBe(12_300); // Rp 123.49 → Rp 123
    expect(roundToStep(12_350, 1)).toBe(12_400); // Rp 123.50 → Rp 124 (half up)
  });

  it('rounds to the nearest Rp 100', () => {
    expect(roundToStep(rp(12_349), 100)).toBe(rp(12_300));
    expect(roundToStep(rp(12_350), 100)).toBe(rp(12_400));
    expect(roundToStep(0, 100)).toBe(0);
  });
});

describe('calculateTotals', () => {
  it('exclusive tax: 11 % on top of the subtotal', () => {
    const totals = calculateTotals([line(2, 50_000), line(1, 100_000)], noDiscount, exclusive);
    expect(totals.subtotal).toBe(rp(200_000));
    expect(totals.taxBase).toBe(rp(200_000));
    expect(totals.tax).toBe(rp(22_000));
    expect(totals.total).toBe(rp(222_000));
    expect(totals.rounding).toBe(0);
  });

  it('inclusive tax: splits the price into net amount and tax', () => {
    const totals = calculateTotals([line(1, 111_000)], noDiscount, {
      ...exclusive,
      taxMode: 'inclusive',
    });
    expect(totals.taxBase).toBe(rp(100_000));
    expect(totals.tax).toBe(rp(11_000));
    expect(totals.total).toBe(rp(111_000)); // the customer pays the listed price
  });

  it('applies discount, then service fee, then tax, then rounding — in that order', () => {
    const totals = calculateTotals(
      [line(3, 33_333)],
      { type: 'percent', value: 1_000 },
      { taxRateBp: 1_100, serviceFeeBp: 500, taxMode: 'exclusive', roundingStep: 100 },
    );
    expect(totals.subtotal).toBe(rp(99_999));
    expect(totals.discount).toBe(999_990); // 10 % = Rp 9 999.90
    expect(totals.afterDiscount).toBe(8_999_910);
    expect(totals.serviceFee).toBe(449_996); // 5 % = 449 995.5 → 449 996
    expect(totals.tax).toBe(1_039_490); // 11 % of 9 449 906 = 1 039 489.66 → 1 039 490
    expect(totals.totalBeforeRounding).toBe(10_489_396);
    expect(totals.total).toBe(rp(104_900)); // Rp 104 893.96 → Rp 104 900
    expect(totals.rounding).toBe(rp(104_900) - 10_489_396);
  });

  it('can round down (negative adjustment)', () => {
    const totals = calculateTotals([line(1, 10_040)], noDiscount, {
      ...exclusive,
      taxRateBp: 0,
      roundingStep: 100,
    });
    expect(totals.total).toBe(rp(10_000));
    expect(totals.rounding).toBe(-rp(40));
  });

  it('a capped fixed discount makes the invoice free, never negative', () => {
    const totals = calculateTotals(
      [line(1, 20_000)],
      { type: 'amount', value: rp(50_000) },
      exclusive,
    );
    expect(totals.discountCapped).toBe(true);
    expect(totals.afterDiscount).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('an empty invoice totals zero', () => {
    const totals = calculateTotals([], noDiscount, exclusive);
    expect(totals.total).toBe(0);
    expect(totals.lineTotals).toEqual([]);
  });

  it('stays exact with very large amounts (checked against BigInt arithmetic)', () => {
    // One line at the limits: 10 000 × Rp 1 000 000 000 = Rp 1e13 = 1e15 sen.
    const big = { quantity: LIMITS.maxQuantity, unitPrice: LIMITS.maxUnitPrice, discountBp: 3_333 };
    const totals = calculateTotals([big], noDiscount, exclusive);
    const gross = 10n ** 15n;
    const net = (gross * 6_667n + 5_000n) / 10_000n; // −33.33 %, half up
    const tax = (net * 1_100n + 5_000n) / 10_000n;
    expect(BigInt(totals.subtotal)).toBe(net);
    expect(BigInt(totals.tax)).toBe(tax);
    expect(BigInt(totals.totalBeforeRounding)).toBe(net + tax);
  });

  it('refuses totals that would lose precision instead of returning a wrong number', () => {
    const max = { quantity: LIMITS.maxQuantity, unitPrice: LIMITS.maxUnitPrice, discountBp: 0 };
    const lines = Array.from({ length: LIMITS.maxLines }, () => max); // 5e16 sen > 2^53
    expect(() => calculateTotals(lines, noDiscount, exclusive)).toThrow(RangeError);
    expect(tryCalculateTotals(lines, noDiscount, exclusive)).toBeNull();
  });

  it('rejects more lines than the limit and invalid settings', () => {
    const many = Array.from({ length: LIMITS.maxLines + 1 }, () => line(1, 1));
    expect(() => calculateTotals(many, noDiscount, exclusive)).toThrow(RangeError);
    expect(() => assertSettings({ ...exclusive, taxRateBp: -1 })).toThrow(RangeError);
    expect(() => assertSettings({ ...exclusive, serviceFeeBp: 3_001 })).toThrow(RangeError);
    expect(() =>
      assertSettings({ ...exclusive, taxMode: 'both' as unknown as 'exclusive' }),
    ).toThrow(RangeError);
    expect(() => assertSettings({ ...exclusive, roundingStep: 50 as unknown as 1 })).toThrow(
      RangeError,
    );
  });
});

describe('tryCalculateTotals', () => {
  it('returns totals for valid input and null for invalid input', () => {
    expect(tryCalculateTotals([line(1, 1_000)], noDiscount, exclusive)?.total).toBe(rp(1_110));
    expect(tryCalculateTotals([line(0, 1_000)], noDiscount, exclusive)).toBeNull();
  });

  it('does not swallow programming errors', () => {
    const broken = null as unknown as LineInput[];
    expect(() => tryCalculateTotals(broken, noDiscount, exclusive)).toThrow(TypeError);
  });
});

describe('unit conversions for typed input', () => {
  it('converts percent to basis points and rupiah to sen', () => {
    expect(percentToBp(11)).toBe(1_100);
    expect(percentToBp(2.5)).toBe(250);
    expect(rupiahToSen(1_234.56)).toBe(123_456);
    expect(rupiahToSen(0.1 + 0.2)).toBe(30); // no floating-point surprise
  });
});
