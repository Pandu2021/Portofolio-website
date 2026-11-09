/**
 * @file cartReducer.ts
 * Cart state as a pure reducer (easy to test, no side effects).
 *
 * Why Context + useReducer instead of a state library (e.g. Zustand)?
 * The cart is one small piece of state used by a handful of components.
 * A reducer keeps every change explicit and testable without adding a
 * dependency; persistence lives in cartStorage.ts, not in the reducer.
 */
import { MAX_QUANTITY, normalizePromoCode } from '../lib/pricing';

/** One product line in the cart. */
export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  /** Applied promo code (validated for display by pricing.checkPromo). */
  promoCode: string | null;
}

export type CartAction =
  | { type: 'add'; productId: string; quantity?: number }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' }
  | { type: 'applyPromo'; code: string }
  | { type: 'removePromo' };

export const EMPTY_CART: CartState = { items: [], promoCode: null };

/** Keeps a quantity a whole number between 0 and {@link MAX_QUANTITY}. */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(Math.max(Math.trunc(quantity), 0), MAX_QUANTITY);
}

/** Returns the next cart state for an action. Never mutates `state`. */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const amount = clampQuantity(action.quantity ?? 1);
      if (amount === 0) return state;
      const existing = state.items.find((item) => item.productId === action.productId);
      const items = existing
        ? state.items.map((item) =>
            item.productId === action.productId
              ? { ...item, quantity: clampQuantity(item.quantity + amount) }
              : item,
          )
        : [...state.items, { productId: action.productId, quantity: amount }];
      return { ...state, items };
    }
    case 'setQuantity': {
      const quantity = clampQuantity(action.quantity);
      if (quantity === 0)
        return cartReducer(state, { type: 'remove', productId: action.productId });
      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.productId ? { ...item, quantity } : item,
        ),
      };
    }
    case 'remove':
      return { ...state, items: state.items.filter((item) => item.productId !== action.productId) };
    case 'clear':
      return EMPTY_CART;
    case 'applyPromo': {
      const code = normalizePromoCode(action.code);
      return { ...state, promoCode: code || null };
    }
    case 'removePromo':
      return { ...state, promoCode: null };
  }
}
