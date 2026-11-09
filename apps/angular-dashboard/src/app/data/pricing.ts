/**
 * @file pricing.ts
 * Pricing settings: defaults, limits, a defensive parser for stored values and
 * the pure function that prices an order. All amounts are whole rupiah.
 */

/** Admin-editable pricing rules. */
export interface PricingSettings {
  /** Tax rate in percent, e.g. 11. */
  taxPercent: number;
  /** Flat delivery fee in IDR. */
  deliveryFee: number;
  /** Subtotal from which delivery is free; 0 = never free. */
  freeDeliveryFrom: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  taxPercent: 11,
  deliveryFee: 10_000,
  freeDeliveryFrom: 150_000,
};

/** Allowed ranges (used by the form validators and the storage parser). */
export const PRICING_LIMITS = {
  taxPercent: { min: 0, max: 25 },
  deliveryFee: { min: 0, max: 100_000 },
  freeDeliveryFrom: { min: 0, max: 10_000_000 },
} as const;

/** The parts of an order total. */
export interface OrderAmounts {
  subtotal: number;
  tax: number;
  delivery: number;
  total: number;
}

/**
 * Prices an order: tax on the subtotal, delivery unless the free-delivery
 * threshold is reached.
 */
export function priceOrder(subtotal: number, settings: PricingSettings): OrderAmounts {
  const tax = Math.round((subtotal * settings.taxPercent) / 100);
  const freeDelivery = settings.freeDeliveryFrom > 0 && subtotal >= settings.freeDeliveryFrom;
  const delivery = subtotal > 0 && !freeDelivery ? settings.deliveryFee : 0;
  return { subtotal, tax, delivery, total: subtotal + tax + delivery };
}

/** Whether a set of values satisfies every rule (ranges, decimals, cross-field). */
export function isValidPricing(value: PricingSettings): boolean {
  const inRange = (key: keyof PricingSettings) =>
    Number.isFinite(value[key]) &&
    value[key] >= PRICING_LIMITS[key].min &&
    value[key] <= PRICING_LIMITS[key].max;
  return (
    inRange('taxPercent') &&
    inRange('deliveryFee') &&
    inRange('freeDeliveryFrom') &&
    Math.round(value.taxPercent * 100) === value.taxPercent * 100 &&
    Number.isInteger(value.deliveryFee) &&
    Number.isInteger(value.freeDeliveryFrom) &&
    (value.freeDeliveryFrom === 0 || value.freeDeliveryFrom > value.deliveryFee)
  );
}

/** Parses stored settings; falls back to the defaults if anything is off. */
export function parsePricing(raw: unknown): PricingSettings {
  if (raw === null || typeof raw !== 'object') return DEFAULT_PRICING;
  const { taxPercent, deliveryFee, freeDeliveryFrom } = raw as Record<string, unknown>;
  if (
    typeof taxPercent !== 'number' ||
    typeof deliveryFee !== 'number' ||
    typeof freeDeliveryFrom !== 'number'
  ) {
    return DEFAULT_PRICING;
  }
  const candidate = { taxPercent, deliveryFee, freeDeliveryFrom };
  return isValidPricing(candidate) ? candidate : DEFAULT_PRICING;
}
