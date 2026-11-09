/**
 * @file CartContext.tsx
 * Cart provider: `useReducer` for state, localStorage for persistence, and
 * derived values (lines with product data, totals, item count).
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { PRODUCT_BY_ID, type Product } from '../data/products';
import { calculateTotals, type Totals } from '../lib/pricing';
import { cartReducer, type CartAction, type CartState } from './cartReducer';
import { loadCart, saveCart } from './cartStorage';

/** A cart line joined with its product. */
export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

interface CartValue {
  state: CartState;
  lines: CartLine[];
  totals: Totals;
  /** Total number of units in the cart. */
  count: number;
  dispatch: (action: CartAction) => void;
}

const CartContext = createContext<CartValue | null>(null);

/** Provides the cart to the app and saves every change. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, () => loadCart());

  useEffect(() => saveCart(state), [state]);

  const value = useMemo<CartValue>(() => {
    const lines = state.items.flatMap((item) => {
      const product = PRODUCT_BY_ID.get(item.productId);
      return product
        ? [{ product, quantity: item.quantity, lineTotal: product.price * item.quantity }]
        : [];
    });
    const totals = calculateTotals(
      lines.map((line) => ({ unitPrice: line.product.price, quantity: line.quantity })),
      state.promoCode,
    );
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    return { state, lines, totals, count, dispatch };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Access the cart. */
export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
