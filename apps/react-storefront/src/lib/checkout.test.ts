/**
 * @file checkout.test.ts
 * Checkout validation rules and demo order numbers.
 */
import { describe, expect, it } from 'vitest';
import { createOrderNumber, EMPTY_CHECKOUT, validateCheckout } from './checkout';

const valid = {
  ...EMPTY_CHECKOUT,
  name: 'Budi Santoso',
  email: 'budi@example.com',
  address: 'Jl. Contoh No. 1, Jakarta',
};

describe('checkout validation', () => {
  it('accepts a complete form', () => {
    expect(validateCheckout(valid)).toEqual({});
  });

  it('requires name, e-mail and address', () => {
    expect(validateCheckout(EMPTY_CHECKOUT)).toEqual({
      name: 'required',
      email: 'required',
      address: 'required',
    });
  });

  it('checks lengths and e-mail format', () => {
    expect(validateCheckout({ ...valid, name: 'A' }).name).toBe('length');
    expect(validateCheckout({ ...valid, email: 'not-an-email' }).email).toBe('email');
    expect(validateCheckout({ ...valid, email: 'a b@example.com' }).email).toBe('email');
    expect(validateCheckout({ ...valid, address: 'short' }).address).toBe('length');
    expect(validateCheckout({ ...valid, notes: 'x'.repeat(201) }).notes).toBe('length');
  });

  it('ignores surrounding whitespace', () => {
    expect(validateCheckout({ ...valid, name: '   ' }).name).toBe('required');
  });
});

describe('createOrderNumber', () => {
  it('creates readable demo order numbers', () => {
    const number = createOrderNumber();
    expect(number).toMatch(/^DEMO-[A-HJ-NP-Z2-9]{6}$/);
    expect(createOrderNumber()).not.toBe(number);
  });
});
