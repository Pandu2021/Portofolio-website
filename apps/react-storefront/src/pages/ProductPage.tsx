/**
 * @file ProductPage.tsx
 * Product details with a quantity picker.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Icon } from '../components/Icon';
import { QuantityStepper } from '../components/QuantityStepper';
import { PRODUCT_BY_ID } from '../data/products';
import { useCartActions } from '../hooks/useCartActions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useI18n } from '../i18n/I18nContext';

/** Details of one product (`#/product/:id`). */
export function ProductPage() {
  const { id = '' } = useParams();
  const { t, locale, formatPrice } = useI18n();
  const { add } = useCartActions();
  const [quantity, setQuantity] = useState(1);
  const product = PRODUCT_BY_ID.get(id);
  useDocumentTitle(product ? product.name[locale] : t.productNotFound);

  if (!product) {
    return (
      <div className="empty">
        <h1>{t.productNotFound}</h1>
        <Link to="/" className="btn btn--secondary">
          {t.backToMenu}
        </Link>
      </div>
    );
  }

  const name = product.name[locale];
  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="arrowLeft" size={16} />
        {t.backToMenu}
      </Link>
      <article className="product-detail">
        <div
          className="product-art product-art--large"
          data-category={product.category}
          aria-hidden="true"
        >
          {product.emoji}
        </div>
        <div className="product-detail__body">
          <p className="product-card__category">{t.category[product.category]}</p>
          <h1>{name}</h1>
          <p className="product-detail__description">{product.description[locale]}</p>
          <p className="price price--large">{formatPrice(product.price)}</p>
          <div className="product-detail__actions">
            <QuantityStepper name={name} value={quantity} onChange={setQuantity} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                add(product, quantity);
                setQuantity(1);
              }}
            >
              <Icon name="cart" size={18} />
              {t.addToCart}
            </button>
          </div>
        </div>
      </article>
    </>
  );
}
