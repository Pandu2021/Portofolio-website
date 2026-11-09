/**
 * @file cart.test.ts
 * Cart reducer (pure state changes) and storage (defensive persistence).
 */
import { describe, expect, it } from 'vitest';
import { PRODUCT_BY_ID } from '../data/products';
import { MAX_QUANTITY } from '../lib/pricing';
import { cartReducer, EMPTY_CART, type CartState } from './cartReducer';
import { CART_STORAGE_KEY, loadCart, sanitizeCart, saveCart } from './cartStorage';

const withLatte: CartState = { items: [{ productId: 'cappuccino', quantity: 2 }], promoCode: null };

describe('cartReducer', () => {
  it('adds new products and increments existing ones', () => {
    const once = cartReducer(EMPTY_CART, { type: 'add', productId: 'cappuccino' });
    const twice = cartReducer(once, { type: 'add', productId: 'cappuccino', quantity: 3 });
    expect(twice.items).toEqual([{ productId: 'cappuccino', quantity: 4 }]);
  });

  it('never exceeds the maximum quantity', () => {
    const state = cartReducer(withLatte, { type: 'add', productId: 'cappuccino', quantity: 999 });
    expect(state.items[0]?.quantity).toBe(MAX_QUANTITY);
  });

  it('removes a line when its quantity drops to zero', () => {
    expect(
      cartReducer(withLatte, { type: 'setQuantity', productId: 'cappuccino', quantity: 0 }).items,
    ).toEqual([]);
  });

  it('removes, clears and handles promo codes', () => {
    expect(cartReducer(withLatte, { type: 'remove', productId: 'cappuccino' }).items).toEqual([]);
    expect(cartReducer(withLatte, { type: 'clear' })).toEqual(EMPTY_CART);
    const promo = cartReducer(withLatte, { type: 'applyPromo', code: ' hemat10 ' });
    expect(promo.promoCode).toBe('HEMAT10');
    expect(cartReducer(promo, { type: 'removePromo' }).promoCode).toBeNull();
  });

  it('does not mutate the previous state', () => {
    const before = structuredClone(withLatte);
    cartReducer(withLatte, { type: 'add', productId: 'cappuccino' });
    expect(withLatte).toEqual(before);
  });
});

describe('cart storage', () => {
  it('round-trips the cart through localStorage', () => {
    saveCart(withLatte);
    expect(loadCart()).toEqual(withLatte);
  });

  it('discards malformed JSON', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{not json');
    expect(loadCart()).toEqual(EMPTY_CART);
  });

  it('drops unknown products, duplicates, bad quantities and unsafe promo codes', () => {
    const dirty = {
      items: [
        { productId: 'cappuccino', quantity: 2 },
        { productId: 'cappuccino', quantity: 5 }, // duplicate
        { productId: 'not-a-product', quantity: 1 },
        { productId: 'cold-brew', quantity: -3 },
        { productId: 'matcha-latte', quantity: 1e9 },
        'garbage',
      ],
      promoCode: '<img src=x onerror=alert(1)>',
    };
    expect(sanitizeCart(dirty, PRODUCT_BY_ID)).toEqual({
      items: [
        { productId: 'cappuccino', quantity: 2 },
        { productId: 'matcha-latte', quantity: MAX_QUANTITY },
      ],
      promoCode: null,
    });
  });
});
