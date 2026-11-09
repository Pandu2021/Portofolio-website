/**
 * @file PromoForm.tsx
 * Promo code input with accessible feedback (valid, unknown, minimum not met).
 */
import { useId, useState, type FormEvent } from 'react';
import { useAnnounce } from '../a11y/Announcer';
import { useCart } from '../cart/CartContext';
import { checkPromo } from '../lib/pricing';
import { useI18n } from '../i18n/I18nContext';

/** Apply or remove a promo code. */
export function PromoForm() {
  const { t, formatPrice } = useI18n();
  const { state, totals, dispatch } = useCart();
  const announce = useAnnounce();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const messageId = useId();

  const describe = (check: ReturnType<typeof checkPromo>): string | null => {
    if (check.ok) return null;
    return check.reason === 'unknown'
      ? t.promoUnknown
      : t.promoMinimum(formatPrice(check.minSubtotal ?? 0));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    const check = checkPromo(code, totals.subtotal);
    const message = describe(check);
    setError(message);
    if (check.ok) {
      dispatch({ type: 'applyPromo', code: check.code });
      setCode('');
      announce(t.promoApplied(check.code));
    } else if (message) {
      announce(message);
    }
  };

  // An applied code can become invalid when items are removed (minimum not met).
  const appliedProblem = totals.promo && !totals.promo.ok ? describe(totals.promo) : null;

  if (state.promoCode) {
    return (
      <div className="promo">
        <p className={appliedProblem ? 'field-error' : 'promo__applied'}>
          {appliedProblem ?? t.promoApplied(state.promoCode)}
        </p>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => dispatch({ type: 'removePromo' })}
        >
          {t.promoRemove}
        </button>
      </div>
    );
  }

  return (
    <form className="promo" onSubmit={onSubmit} noValidate>
      <label htmlFor={inputId} className="field-label">
        {t.promoLabel}
      </label>
      <div className="promo__row">
        <input
          id={inputId}
          className="input"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
        />
        <button type="submit" className="btn btn--secondary btn--sm">
          {t.promoApply}
        </button>
      </div>
      <p id={messageId} className={error ? 'field-error' : 'hint'}>
        {error ?? t.promoHint}
      </p>
    </form>
  );
}
