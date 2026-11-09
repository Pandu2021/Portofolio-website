/**
 * @file CheckoutPage.tsx
 * Demo checkout: accessible validation (error summary + inline errors linked
 * with aria-describedby) and a fake confirmation. Nothing is sent or stored.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { PriceSummary } from '../components/PriceSummary';
import { useCart } from '../cart/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  createOrderNumber,
  EMPTY_CHECKOUT,
  validateCheckout,
  VALIDATED_FIELDS,
  type CheckoutErrors,
  type CheckoutValues,
  type ValidatedField,
} from '../lib/checkout';
import type { Totals } from '../lib/pricing';
import { useI18n } from '../i18n/I18nContext';

/** Snapshot shown after a successful demo order. */
interface Confirmation {
  orderNumber: string;
  totals: Totals;
}

/** The checkout page (`#/checkout`). */
export function CheckoutPage() {
  const { t } = useI18n();
  const { lines, totals, dispatch } = useCart();
  const [values, setValues] = useState<CheckoutValues>(EMPTY_CHECKOUT);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [attempt, setAttempt] = useState(0);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  useDocumentTitle(confirmation ? t.orderTitle : t.checkoutTitle);

  // Move focus to the error summary after a failed submit, or to the
  // confirmation heading after success (WCAG 3.3.1 / 2.4.3).
  useEffect(() => {
    if (attempt === 0) return;
    if (confirmation) confirmationRef.current?.focus();
    else summaryRef.current?.focus();
  }, [attempt, confirmation]);

  const labels: Record<ValidatedField, string> = {
    name: t.fieldName,
    email: t.fieldEmail,
    address: t.fieldAddress,
    notes: t.fieldNotes,
  };

  /** Localized text for one field error. */
  const messageFor = (field: ValidatedField): string | null => {
    const error = errors[field];
    if (!error) return null;
    if (error === 'required') return t.errorRequired(labels[field]);
    if (error === 'email') return t.errorEmail;
    return {
      name: t.errorNameLength,
      address: t.errorAddressLength,
      notes: t.errorNotesLength,
      email: t.errorEmail,
    }[field];
  };

  const onChange =
    (field: keyof CheckoutValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateCheckout(values);
    setErrors(found);
    setAttempt((count) => count + 1);
    if (Object.keys(found).length === 0) {
      setConfirmation({ orderNumber: createOrderNumber(), totals });
      dispatch({ type: 'clear' });
    }
  };

  if (confirmation) {
    return (
      <div className="confirmation card">
        <h1 ref={confirmationRef} tabIndex={-1}>
          {t.orderTitle}
        </h1>
        <p className="confirmation__number">{t.orderNumber(confirmation.orderNumber)}</p>
        <p>{t.orderThanks}</p>
        <PriceSummary totals={confirmation.totals} />
        <Link to="/" className="btn btn--primary">
          {t.continueShopping}
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="empty">
        <h1>{t.checkoutTitle}</h1>
        <p>{t.checkoutEmpty}</p>
        <Link to="/" className="btn btn--primary">
          {t.browseMenu}
        </Link>
      </div>
    );
  }

  const errorFields = VALIDATED_FIELDS.filter((field) => errors[field]);

  /** Common accessibility props for a validated field. */
  const a11y = (field: ValidatedField) => ({
    id: `checkout-${field}`,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `checkout-${field}-error` : undefined,
  });

  /** Inline error under a field. */
  const fieldError = (field: ValidatedField) =>
    errors[field] ? (
      <p id={`checkout-${field}-error`} className="field-error">
        {messageFor(field)}
      </p>
    ) : null;

  return (
    <>
      <header className="page-head">
        <h1>{t.checkoutTitle}</h1>
        <p className="page-head__intro">{t.checkoutIntro}</p>
      </header>

      <div className="cart-layout">
        <form className="card checkout-form" onSubmit={onSubmit} noValidate>
          {errorFields.length > 0 && (
            <div ref={summaryRef} tabIndex={-1} className="error-summary" role="alert">
              <p>{t.errorSummary(errorFields.length)}</p>
              <ul>
                {errorFields.map((field) => (
                  <li key={field}>
                    <a href={`#checkout-${field}`}>{messageFor(field)}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="field">
            <label htmlFor="checkout-name" className="field-label">
              {t.fieldName} <span className="hint">{t.required}</span>
            </label>
            <input
              {...a11y('name')}
              className="input"
              autoComplete="name"
              maxLength={80}
              value={values.name}
              onChange={onChange('name')}
            />
            {fieldError('name')}
          </div>

          <div className="field">
            <label htmlFor="checkout-email" className="field-label">
              {t.fieldEmail} <span className="hint">{t.required}</span>
            </label>
            <input
              {...a11y('email')}
              type="email"
              className="input"
              autoComplete="email"
              maxLength={254}
              value={values.email}
              onChange={onChange('email')}
            />
            {fieldError('email')}
          </div>

          <div className="field">
            <label htmlFor="checkout-address" className="field-label">
              {t.fieldAddress} <span className="hint">{t.required}</span>
            </label>
            <textarea
              {...a11y('address')}
              className="input"
              rows={3}
              autoComplete="street-address"
              maxLength={240}
              value={values.address}
              onChange={onChange('address')}
            />
            {fieldError('address')}
          </div>

          <div className="field">
            <label htmlFor="checkout-time" className="field-label">
              {t.fieldTime}
            </label>
            <select
              id="checkout-time"
              className="input"
              value={values.time}
              onChange={onChange('time')}
            >
              <option value="asap">{t.timeAsap}</option>
              <option value="lunch">{t.timeLunch}</option>
              <option value="dinner">{t.timeDinner}</option>
            </select>
          </div>

          <fieldset className="field">
            <legend className="field-label">{t.fieldPayment}</legend>
            <div className="radio-row">
              {(['card', 'transfer'] as const).map((option) => (
                <label key={option} className="radio">
                  <input
                    type="radio"
                    name="payment"
                    value={option}
                    checked={values.payment === option}
                    onChange={onChange('payment')}
                  />
                  {option === 'card' ? t.paymentCard : t.paymentTransfer}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="checkout-notes" className="field-label">
              {t.fieldNotes}
            </label>
            <textarea
              {...a11y('notes')}
              className="input"
              rows={2}
              maxLength={240}
              value={values.notes}
              onChange={onChange('notes')}
            />
            {fieldError('notes')}
          </div>

          <button type="submit" className="btn btn--primary btn--block">
            {t.placeOrder}
          </button>
        </form>

        <aside className="card cart-aside" aria-labelledby="checkout-summary-title">
          <h2 id="checkout-summary-title" className="cart-aside__title">
            {t.summaryTitle}
          </h2>
          <PriceSummary totals={totals} />
        </aside>
      </div>
    </>
  );
}
