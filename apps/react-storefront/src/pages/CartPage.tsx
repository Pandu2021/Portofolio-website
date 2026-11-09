/**
 * @file CartPage.tsx
 * Cart lines with quantity controls, promo code and order summary.
 */
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { PriceSummary } from '../components/PriceSummary';
import { PromoForm } from '../components/PromoForm';
import { QuantityStepper } from '../components/QuantityStepper';
import { useCart } from '../cart/CartContext';
import { useCartActions } from '../hooks/useCartActions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useI18n } from '../i18n/I18nContext';

/** The shopping cart (`#/cart`). */
export function CartPage() {
  const { t, locale, formatPrice } = useI18n();
  const { lines, totals } = useCart();
  const { setQuantity, remove } = useCartActions();
  useDocumentTitle(t.cartTitle);

  if (lines.length === 0) {
    return (
      <div className="empty">
        <h1>{t.cartTitle}</h1>
        <p>{t.cartEmpty}</p>
        <Link to="/" className="btn btn--primary">
          {t.browseMenu}
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <h1>{t.cartTitle}</h1>
      </header>
      <div className="cart-layout">
        <ul className="cart-lines">
          {lines.map(({ product, quantity, lineTotal }) => {
            const name = product.name[locale];
            return (
              <li key={product.id} className="card cart-line">
                <div
                  className="product-art product-art--small"
                  data-category={product.category}
                  aria-hidden="true"
                >
                  {product.emoji}
                </div>
                <div className="cart-line__info">
                  <h2 className="cart-line__name">
                    <Link to={`/product/${product.id}`}>{name}</Link>
                  </h2>
                  <p className="hint">
                    {formatPrice(product.price)} {t.each}
                  </p>
                </div>
                <QuantityStepper
                  name={name}
                  value={quantity}
                  min={0}
                  onChange={(next) => setQuantity(product, next)}
                />
                <p className="cart-line__total">{formatPrice(lineTotal)}</p>
                <button
                  type="button"
                  className="icon-button icon-button--danger"
                  onClick={() => remove(product)}
                  aria-label={t.remove(name)}
                  title={t.remove(name)}
                >
                  <Icon name="trash" size={18} />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="card cart-aside" aria-labelledby="summary-title">
          <h2 id="summary-title" className="cart-aside__title">
            {t.summaryTitle}
          </h2>
          <PromoForm />
          <PriceSummary totals={totals} />
          <Link to="/checkout" className="btn btn--primary btn--block">
            {t.checkout}
          </Link>
        </aside>
      </div>
    </>
  );
}
