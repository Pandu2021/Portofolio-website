/**
 * @file App.test.tsx
 * Integration tests: the storefront used the way a visitor uses it
 * (search, filter, cart, promo, checkout, language and theme).
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CART_STORAGE_KEY } from './cart/cartStorage';
import { LOCALE_STORAGE_KEY } from './i18n/I18nContext';
import { PRODUCTS } from './data/products';
import { renderApp } from './test/render';

/** Puts products in the saved cart before the app starts. */
function seedCart(
  items: { productId: string; quantity: number }[],
  promoCode: string | null = null,
) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, promoCode }));
}

describe('catalog', () => {
  it('lists every product and filters by search text', () => {
    renderApp('/');
    expect(screen.getAllByRole('article')).toHaveLength(PRODUCTS.length);

    fireEvent.change(screen.getByLabelText('Search the menu'), { target: { value: 'noodles' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Chicken Noodles' })).toBeTruthy();
  });

  it('filters by category with pressed-state buttons', () => {
    renderApp('/');
    const tea = screen.getByRole('button', { name: 'Tea' });
    fireEvent.click(tea);
    expect(tea.getAttribute('aria-pressed')).toBe('true');
    for (const card of screen.getAllByRole('article')) {
      expect(within(card).getByText('Tea')).toBeTruthy();
    }
  });

  it('reads the filters from the URL', () => {
    renderApp('/?category=meal&sort=price-asc');
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual(['Chicken Noodles', 'Chicken Satay', 'Special Fried Rice']);
  });
});

describe('cart', () => {
  it('adds a product, updates the cart count, announces it and saves it', async () => {
    renderApp('/');
    fireEvent.click(screen.getByRole('button', { name: 'Add Cappuccino to cart' }));

    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeTruthy();
    expect(await screen.findByText('1 × Cappuccino added to the cart.')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '{}')).toMatchObject({
      items: [{ productId: 'cappuccino', quantity: 1 }],
    });
  });

  it('changes quantities and removes lines on the cart page', () => {
    seedCart([{ productId: 'cappuccino', quantity: 2 }]);
    renderApp('/cart');

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity of Cappuccino' }));
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Cappuccino' }));
    expect(screen.getByText('Your cart is empty.')).toBeTruthy();
  });

  it('applies a valid promo code and rejects an unknown one', () => {
    seedCart([{ productId: 'special-fried-rice', quantity: 2 }]); // 90.000
    renderApp('/cart');
    const input = screen.getByLabelText('Promo code');

    fireEvent.change(input, { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('This promo code does not exist.')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(input, { target: { value: 'hemat10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('Code HEMAT10 applied.')).toBeTruthy();
    expect(screen.getByText('Discount (HEMAT10)')).toBeTruthy();
  });
});

describe('checkout', () => {
  it('shows an error summary and marks invalid fields', () => {
    seedCart([{ productId: 'cappuccino', quantity: 1 }]);
    renderApp('/checkout');
    fireEvent.click(screen.getByRole('button', { name: 'Place demo order' }));

    const summary = screen.getByRole('alert');
    expect(within(summary).getAllByRole('link')).toHaveLength(3);
    expect(document.activeElement).toBe(summary);
    const email = screen.getByLabelText(/^Email/);
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('checkout-email-error');
  });

  it('confirms a valid demo order and empties the cart', () => {
    seedCart([{ productId: 'cappuccino', quantity: 1 }]);
    renderApp('/checkout');
    fireEvent.change(screen.getByLabelText(/^Full name/), { target: { value: 'Budi Santoso' } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'budi@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Delivery address/), {
      target: { value: 'Jl. Contoh No. 1, Jakarta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Place demo order' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Order confirmed (demo)' })).toBeTruthy();
    expect(screen.getByText(/^Order number: DEMO-/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Cart, 0 items' })).toBeTruthy();
  });
});

describe('language and theme', () => {
  it('switches to Indonesian, updates <html lang> and remembers the choice', () => {
    renderApp('/');
    fireEvent.click(screen.getByRole('button', { name: /^ID/ }));

    expect(screen.getByLabelText('Cari menu')).toBeTruthy();
    expect(document.documentElement.lang).toBe('id-ID');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('id');
    expect(screen.getByRole('link', { name: /Kembali ke portofolio/ }).getAttribute('href')).toBe(
      '../id/',
    );
  });

  it('cycles the shared color theme', () => {
    renderApp('/');
    const toggle = screen.getByRole('button', { name: /Change color theme: System/ });
    act(() => fireEvent.click(toggle));
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('shows a not-found page for unknown routes', () => {
    renderApp('/nowhere');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  });
});
