/**
 * @file catalog.test.ts
 * Search, category filter, sort and safe URL parsing.
 */
import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../data/products';
import { filterProducts, parseCatalogQuery, type CatalogQuery } from './catalog';

const query = (patch: Partial<CatalogQuery> = {}): CatalogQuery => ({
  search: '',
  category: 'all',
  sort: 'featured',
  ...patch,
});

describe('catalog', () => {
  it('returns every product by featured rank by default', () => {
    const result = filterProducts(PRODUCTS, query(), 'en');
    expect(result).toHaveLength(PRODUCTS.length);
    expect(result[0]?.id).toBe('palm-sugar-latte');
  });

  it('searches names and descriptions in the current language', () => {
    expect(filterProducts(PRODUCTS, query({ search: 'noodles' }), 'en').map((p) => p.id)).toEqual([
      'chicken-noodles',
    ]);
    expect(filterProducts(PRODUCTS, query({ search: 'mie' }), 'id').map((p) => p.id)).toEqual([
      'chicken-noodles',
    ]);
  });

  it('is case- and accent-insensitive', () => {
    expect(filterProducts(PRODUCTS, query({ search: 'CROISSÁNT' }), 'en')).toHaveLength(1);
  });

  it('filters by category', () => {
    const tea = filterProducts(PRODUCTS, query({ category: 'tea' }), 'en');
    expect(tea.length).toBeGreaterThan(0);
    expect(tea.every((p) => p.category === 'tea')).toBe(true);
  });

  it('sorts by price both ways', () => {
    const asc = filterProducts(PRODUCTS, query({ sort: 'price-asc' }), 'en').map((p) => p.price);
    const desc = filterProducts(PRODUCTS, query({ sort: 'price-desc' }), 'en').map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...asc].reverse());
  });

  it('ignores unknown or oversized URL values', () => {
    const params = new URLSearchParams({
      q: 'x'.repeat(500),
      category: '<script>',
      sort: 'drop table',
    });
    const parsed = parseCatalogQuery(params);
    expect(parsed.search).toHaveLength(60);
    expect(parsed.category).toBe('all');
    expect(parsed.sort).toBe('featured');
  });
});
