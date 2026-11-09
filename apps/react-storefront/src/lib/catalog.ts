/**
 * @file catalog.ts
 * Search, filter and sort for the menu (pure functions).
 */
import { CATEGORIES, type Category, type Product } from '../data/products';
import type { Locale } from '../i18n/messages';

/** Available sort orders. */
export const SORTS = ['featured', 'price-asc', 'price-desc', 'name'] as const;
export type Sort = (typeof SORTS)[number];

/** Catalog query, usually read from the URL (`?q=&category=&sort=`). */
export interface CatalogQuery {
  search: string;
  category: Category | 'all';
  sort: Sort;
}

/** Reads a query from URL search params, ignoring unknown or malicious values. */
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const category = params.get('category');
  const sort = params.get('sort');
  return {
    search: (params.get('q') ?? '').slice(0, 60),
    category: (CATEGORIES as readonly string[]).includes(category ?? '')
      ? (category as Category)
      : 'all',
    sort: (SORTS as readonly string[]).includes(sort ?? '') ? (sort as Sort) : 'featured',
  };
}

/** Lower-case, accent-free text for forgiving search ("créme" matches "creme"). */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Returns the products that match the query, in the requested order.
 * Search looks at the name and description in the current language.
 */
export function filterProducts(
  products: readonly Product[],
  query: CatalogQuery,
  locale: Locale,
): Product[] {
  const needle = normalize(query.search);
  const matches = products.filter((product) => {
    if (query.category !== 'all' && product.category !== query.category) return false;
    if (!needle) return true;
    return normalize(`${product.name[locale]} ${product.description[locale]}`).includes(needle);
  });

  const collator = new Intl.Collator(locale);
  const compare: Record<Sort, (a: Product, b: Product) => number> = {
    featured: (a, b) => a.rank - b.rank,
    'price-asc': (a, b) => a.price - b.price || a.rank - b.rank,
    'price-desc': (a, b) => b.price - a.price || a.rank - b.rank,
    name: (a, b) => collator.compare(a.name[locale], b.name[locale]),
  };
  return matches.sort(compare[query.sort]);
}
