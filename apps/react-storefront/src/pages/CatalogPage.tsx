/**
 * @file CatalogPage.tsx
 * Menu with search, category filter and sort. The query lives in the URL
 * (`#/?q=latte&category=coffee&sort=price-asc`), so results are shareable and
 * survive a page refresh.
 */
import { useId } from 'react';
import { useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { filterProducts, parseCatalogQuery, SORTS, type CatalogQuery } from '../lib/catalog';
import { useI18n } from '../i18n/I18nContext';

/** The product catalog page. */
export function CatalogPage() {
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const query = parseCatalogQuery(params);
  // 12 products: filtering on every render is cheaper than memoizing.
  const results = filterProducts(PRODUCTS, query, locale);
  const searchId = useId();
  const sortId = useId();
  useDocumentTitle(t.catalogTitle);

  /** Writes one query field to the URL, dropping defaults to keep URLs short. */
  const update = (patch: Partial<CatalogQuery>) => {
    const next = { ...query, ...patch };
    const search = new URLSearchParams();
    if (next.search) search.set('q', next.search);
    if (next.category !== 'all') search.set('category', next.category);
    if (next.sort !== 'featured') search.set('sort', next.sort);
    setParams(search, { replace: true });
  };

  return (
    <>
      <header className="page-head">
        <h1>{t.catalogTitle}</h1>
        <p className="page-head__intro">{t.catalogIntro}</p>
      </header>

      <div className="filters">
        <div className="field">
          <label htmlFor={searchId} className="field-label">
            {t.searchLabel}
          </label>
          <input
            id={searchId}
            type="search"
            className="input"
            value={query.search}
            placeholder={t.searchPlaceholder}
            maxLength={60}
            onChange={(event) => update({ search: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor={sortId} className="field-label">
            {t.sortLabel}
          </label>
          <select
            id={sortId}
            className="input"
            value={query.sort}
            onChange={(event) => update({ sort: event.target.value as CatalogQuery['sort'] })}
          >
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {t.sort[sort]}
              </option>
            ))}
          </select>
        </div>

        <div className="field field--wide" role="group" aria-label={t.categoryLabel}>
          <span className="field-label" aria-hidden="true">
            {t.categoryLabel}
          </span>
          <div className="chips">
            {(['all', ...CATEGORIES] as const).map((category) => (
              <button
                key={category}
                type="button"
                className="chip"
                aria-pressed={query.category === category}
                onClick={() => update({ category })}
              >
                {category === 'all' ? t.categoryAll : t.category[category]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="results-count" role="status">
        {t.resultsCount(results.length)}
      </p>

      {results.length > 0 ? (
        <ul className="product-grid">
          {results.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <p>{t.noResults}</p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => update({ search: '', category: 'all' })}
          >
            {t.clearFilters}
          </button>
        </div>
      )}
    </>
  );
}
