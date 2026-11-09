/**
 * @file cartStorage.ts
 * Saves the cart in localStorage and reads it back defensively: storage is
 * user-controlled input, so unknown products, bad quantities and malformed
 * JSON are discarded instead of crashing the app.
 */
import { PRODUCT_BY_ID } from '../data/products';
import { EMPTY_CART, clampQuantity, type CartItem, type CartState } from './cartReducer';

/** Versioned key, so a future format change can ignore old data safely. */
export const CART_STORAGE_KEY = 'storefront-cart-v1';

/**
 * Converts any parsed value into a valid cart.
 * @param raw - Untrusted value (e.g. from JSON.parse).
 * @param knownIds - Product ids that exist in the catalog.
 */
export function sanitizeCart(
  raw: unknown,
  knownIds: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): CartState {
  if (raw === null || typeof raw !== 'object') return EMPTY_CART;
  const { items, promoCode } = raw as { items?: unknown; promoCode?: unknown };

  const seen = new Set<string>();
  const cleanItems: CartItem[] = [];
  for (const entry of Array.isArray(items) ? items : []) {
    if (entry === null || typeof entry !== 'object') continue;
    const { productId, quantity } = entry as { productId?: unknown; quantity?: unknown };
    if (typeof productId !== 'string' || !knownIds.has(productId) || seen.has(productId)) continue;
    const safeQuantity = clampQuantity(typeof quantity === 'number' ? quantity : 0);
    if (safeQuantity === 0) continue;
    seen.add(productId);
    cleanItems.push({ productId, quantity: safeQuantity });
  }

  const cleanPromo =
    typeof promoCode === 'string' && /^[A-Z0-9]{1,20}$/.test(promoCode) ? promoCode : null;
  return { items: cleanItems, promoCode: cleanPromo };
}

/** Reads the saved cart (empty cart if missing, invalid or storage is blocked). */
export function loadCart(storage: Storage | undefined = globalThis.localStorage): CartState {
  try {
    const text = storage?.getItem(CART_STORAGE_KEY);
    return text ? sanitizeCart(JSON.parse(text), PRODUCT_BY_ID) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

/** Saves the cart; silently ignored when storage is unavailable (private mode). */
export function saveCart(
  state: CartState,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the cart still works for this visit.
  }
}
