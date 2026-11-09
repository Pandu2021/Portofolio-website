/**
 * @file ProductCard.tsx
 * Catalog card: picture, name (link to details), price and "Add to cart".
 */
import { Link } from 'react-router';
import type { Product } from '../data/products';
import { useCartActions } from '../hooks/useCartActions';
import { useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';

/** One product in the catalog grid. */
export function ProductCard({ product }: { product: Product }) {
  const { t, locale, formatPrice } = useI18n();
  const { add } = useCartActions();
  const name = product.name[locale];

  return (
    <article className="card product-card">
      <div className="product-art" data-category={product.category} aria-hidden="true">
        {product.emoji}
      </div>
      <div className="product-card__body">
        <p className="product-card__category">{t.category[product.category]}</p>
        <h2 className="product-card__name">
          <Link to={`/product/${product.id}`} className="stretched-link">
            {name}
          </Link>
        </h2>
        <p className="product-card__description">{product.description[locale]}</p>
      </div>
      <div className="product-card__footer">
        <p className="price">{formatPrice(product.price)}</p>
        <button
          type="button"
          className="btn btn--primary btn--sm product-card__add"
          onClick={() => add(product)}
          aria-label={t.addNamedToCart(name)}
        >
          <Icon name="plus" size={16} />
          {t.addToCart}
        </button>
      </div>
    </article>
  );
}
