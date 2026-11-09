/**
 * @file checkout.ts
 * Checkout form rules as pure functions. The demo never sends or stores the
 * form data; validation exists to show accessible, user-friendly forms.
 */

/** Values of the checkout form. */
export interface CheckoutValues {
  name: string;
  email: string;
  address: string;
  time: 'asap' | 'lunch' | 'dinner';
  payment: 'card' | 'transfer';
  notes: string;
}

/** Fields that can have an error, in the order they appear in the form. */
export const VALIDATED_FIELDS = ['name', 'email', 'address', 'notes'] as const;
export type ValidatedField = (typeof VALIDATED_FIELDS)[number];

/** Machine-readable error codes; the UI turns them into localized text. */
export type CheckoutError = 'required' | 'length' | 'email';

export type CheckoutErrors = Partial<Record<ValidatedField, CheckoutError>>;

export const EMPTY_CHECKOUT: CheckoutValues = {
  name: '',
  email: '',
  address: '',
  time: 'asap',
  payment: 'card',
  notes: '',
};

/** Pragmatic e-mail check: something@domain.tld, no spaces, max 254 chars. */
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates the form. Returns an empty object when everything is valid.
 * @param values - Current form values.
 */
export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const address = values.address.trim();

  if (!name) errors.name = 'required';
  else if (name.length < 2 || name.length > 60) errors.name = 'length';

  if (!email) errors.email = 'required';
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'email';

  if (!address) errors.address = 'required';
  else if (address.length < 10 || address.length > 200) errors.address = 'length';

  if (values.notes.trim().length > 200) errors.notes = 'length';
  return errors;
}

/**
 * Creates a random demo order number such as `DEMO-7KQ2XM` using the
 * cryptographically secure random generator.
 */
export function createOrderNumber(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I look-alikes
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `DEMO-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}
