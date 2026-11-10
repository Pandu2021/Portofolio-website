/**
 * @file pricing.ts
 * The pricing engine: pure functions, no Vue, no DOM — fully unit-tested.
 *
 * Money is always an integer number of **sen** (1/100 rupiah), so there are
 * no floating-point errors (0.1 + 0.2). Percentages are **basis points**
 * (1 % = 100 bp, 11 % = 1 100 bp). Multiplications that could exceed
 * Number.MAX_SAFE_INTEGER are done with BigInt and rounded half up.
 *
 * Order of calculation (documented on the page, too):
 *   1. line total     = quantity × unit price − line discount %
 *   2. subtotal       = Σ line totals
 *   3. invoice discount (percent or fixed amount, never more than the subtotal)
 *   4. service fee %  on the discounted amount
 *   5. tax %          exclusive: added on top · inclusive: already inside the prices
 *   6. rounding       of the grand total to Rp 1 or Rp 100
 */

/** Integer amount in sen (1/100 rupiah). */
export type Sen = number;

/** Percentage in basis points (100 bp = 1 %). */
export type BasisPoints = number;

export const SEN_PER_RUPIAH = 100;
export const BP_PER_PERCENT = 100;
export const FULL_BP = 10_000; // 100 %

/** Input limits — they also keep every intermediate value exact. */
export const LIMITS = {
  maxQuantity: 10_000,
  /** Rp 1 000 000 000 per unit. */
  maxUnitPrice: 1_000_000_000 * SEN_PER_RUPIAH,
  maxLines: 50,
} as const;

export interface LineInput {
  quantity: number;
  unitPrice: Sen;
  /** Line discount, 0–10 000 bp. */
  discountBp: BasisPoints;
}

export type InvoiceDiscount =
  { type: 'percent'; value: BasisPoints } | { type: 'amount'; value: Sen };

export type TaxMode = 'exclusive' | 'inclusive';

/** Round the grand total to the nearest Rp 1 or Rp 100. */
export type RoundingStep = 1 | 100;

export interface PricingSettings {
  taxRateBp: BasisPoints;
  serviceFeeBp: BasisPoints;
  taxMode: TaxMode;
  roundingStep: RoundingStep;
}

export interface Totals {
  lineTotals: Sen[];
  subtotal: Sen;
  discount: Sen;
  /** True when a fixed discount was larger than the subtotal and was capped. */
  discountCapped: boolean;
  afterDiscount: Sen;
  serviceFee: Sen;
  /** Amount the tax is calculated on (net of tax). */
  taxBase: Sen;
  tax: Sen;
  totalBeforeRounding: Sen;
  /** Rounding adjustment (can be negative). */
  rounding: Sen;
  total: Sen;
}

/**
 * round(a × b / c), half up, exact for any safe integers (BigInt inside).
 * @throws RangeError when the result is not a safe integer.
 */
export function mulDivRound(a: number, b: number, c: number): number {
  if (c === 0) throw new RangeError('Division by zero');
  const numerator = BigInt(a) * BigInt(b);
  const divisor = BigInt(c);
  const quotient = numerator / divisor;
  const remainder = numerator % divisor;
  // Half up for non-negative values (all amounts in this engine are ≥ 0).
  const rounded = remainder * 2n >= divisor ? quotient + 1n : quotient;
  const result = Number(rounded);
  if (!Number.isSafeInteger(result)) throw new RangeError('Amount is too large');
  return result;
}

function assertInteger(value: number, min: number, max: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max} (got ${value})`);
  }
}

/** Validates one line; throws RangeError with the offending field. */
export function assertLine(line: LineInput): void {
  assertInteger(line.quantity, 1, LIMITS.maxQuantity, 'quantity');
  assertInteger(line.unitPrice, 0, LIMITS.maxUnitPrice, 'unitPrice');
  assertInteger(line.discountBp, 0, FULL_BP, 'discountBp');
}

/** Validates the settings; throws RangeError with the offending field. */
export function assertSettings(settings: PricingSettings): void {
  assertInteger(settings.taxRateBp, 0, 5_000, 'taxRateBp'); // 0–50 %
  assertInteger(settings.serviceFeeBp, 0, 3_000, 'serviceFeeBp'); // 0–30 %
  if (settings.taxMode !== 'exclusive' && settings.taxMode !== 'inclusive') {
    throw new RangeError(
      `taxMode must be exclusive or inclusive (got ${String(settings.taxMode)})`,
    );
  }
  if (settings.roundingStep !== 1 && settings.roundingStep !== 100) {
    throw new RangeError(`roundingStep must be 1 or 100 (got ${String(settings.roundingStep)})`);
  }
}

/** Total of one line: quantity × unit price, minus the line discount. */
export function lineTotal(line: LineInput): Sen {
  assertLine(line);
  const gross = line.quantity * line.unitPrice; // ≤ 10 000 × 1e11 = 1e15 < 2^53
  return mulDivRound(gross, FULL_BP - line.discountBp, FULL_BP);
}

/**
 * Discount amount for the whole invoice, never more than the subtotal.
 * @returns the discount and whether a fixed amount had to be capped.
 */
export function invoiceDiscount(
  subtotal: Sen,
  discount: InvoiceDiscount,
): { amount: Sen; capped: boolean } {
  if (discount.type === 'percent') {
    assertInteger(discount.value, 0, FULL_BP, 'discount percent');
    return { amount: mulDivRound(subtotal, discount.value, FULL_BP), capped: false };
  }
  assertInteger(discount.value, 0, Number.MAX_SAFE_INTEGER, 'discount amount');
  return discount.value > subtotal
    ? { amount: subtotal, capped: true }
    : { amount: discount.value, capped: false };
}

/** Rounds an amount in sen to the nearest Rp `step` (half up). */
export function roundToStep(amount: Sen, step: RoundingStep): Sen {
  const unit = step * SEN_PER_RUPIAH;
  return mulDivRound(amount, 1, unit) * unit;
}

/**
 * Calculates every total of an invoice.
 * @throws RangeError for invalid input (the editor validates before calling).
 */
export function calculateTotals(
  lines: readonly LineInput[],
  discount: InvoiceDiscount,
  settings: PricingSettings,
): Totals {
  assertSettings(settings);
  if (lines.length > LIMITS.maxLines) throw new RangeError(`At most ${LIMITS.maxLines} lines`);

  const lineTotals = lines.map(lineTotal);
  const subtotal = lineTotals.reduce((sum, value) => sum + value, 0);
  // A sum of safe integers can silently lose precision: refuse instead.
  if (!Number.isSafeInteger(subtotal)) throw new RangeError('Amount is too large');
  const { amount: discountAmount, capped } = invoiceDiscount(subtotal, discount);
  const afterDiscount = subtotal - discountAmount;
  const serviceFee = mulDivRound(afterDiscount, settings.serviceFeeBp, FULL_BP);
  const gross = afterDiscount + serviceFee;

  let taxBase: Sen;
  let tax: Sen;
  let totalBeforeRounding: Sen;
  if (settings.taxMode === 'exclusive') {
    taxBase = gross;
    tax = mulDivRound(gross, settings.taxRateBp, FULL_BP);
    totalBeforeRounding = gross + tax;
  } else {
    // Prices already include tax: split the gross amount into net + tax.
    taxBase = mulDivRound(gross, FULL_BP, FULL_BP + settings.taxRateBp);
    tax = gross - taxBase;
    totalBeforeRounding = gross;
  }

  const total = roundToStep(totalBeforeRounding, settings.roundingStep);
  return {
    lineTotals,
    subtotal,
    discount: discountAmount,
    discountCapped: capped,
    afterDiscount,
    serviceFee,
    taxBase,
    tax,
    totalBeforeRounding,
    rounding: total - totalBeforeRounding,
    total,
  };
}

/** Like {@link calculateTotals}, but returns `null` instead of throwing (live UI totals). */
export function tryCalculateTotals(
  lines: readonly LineInput[],
  discount: InvoiceDiscount,
  settings: PricingSettings,
): Totals | null {
  try {
    return calculateTotals(lines, discount, settings);
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}

/** Converts a percentage typed by a person (e.g. 11 or 2.5) into basis points. */
export function percentToBp(percent: number): BasisPoints {
  return Math.round(percent * BP_PER_PERCENT);
}

/** Converts whole/decimal rupiah typed by a person into sen. */
export function rupiahToSen(rupiah: number): Sen {
  return Math.round(rupiah * SEN_PER_RUPIAH);
}
