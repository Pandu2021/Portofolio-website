/**
 * @file PriceSummary.tsx
 * Order summary as a description list (read naturally by screen readers).
 */
import { FREE_DELIVERY_FROM, type Totals } from '../lib/pricing';
import { useI18n } from '../i18n/I18nContext';

/** Subtotal, discount, tax, delivery and total for the current cart. */
export function PriceSummary({ totals }: { totals: Totals }) {
  const { t, formatPrice } = useI18n();
  const missingForFreeDelivery = FREE_DELIVERY_FROM - totals.subtotal;

  return (
    <div className="summary">
      <dl className="summary__list">
        <div>
          <dt>{t.subtotal}</dt>
          <dd>{formatPrice(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="summary__discount">
            <dt>
              {t.discount}
              {totals.promo?.ok && ` (${totals.promo.code})`}
            </dt>
            <dd>−{formatPrice(totals.discount)}</dd>
          </div>
        )}
        <div>
          <dt>{t.tax}</dt>
          <dd>{formatPrice(totals.tax)}</dd>
        </div>
        <div>
          <dt>{t.delivery}</dt>
          <dd>{totals.delivery === 0 ? t.free : formatPrice(totals.delivery)}</dd>
        </div>
        <div className="summary__total">
          <dt>{t.total}</dt>
          <dd>{formatPrice(totals.total)}</dd>
        </div>
      </dl>
      {totals.delivery > 0 && missingForFreeDelivery > 0 && (
        <p className="hint">{t.freeDeliveryHint(formatPrice(missingForFreeDelivery))}</p>
      )}
    </div>
  );
}
