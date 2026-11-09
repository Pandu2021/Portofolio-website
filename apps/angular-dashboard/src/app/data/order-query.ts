/**
 * @file order-query.ts
 * Filtering, sorting and paging of orders as pure functions (no Angular),
 * used by the orders page through `computed()` signals.
 */
import { ORDER_STATUSES, type Order, type OrderStatus } from './orders';

export const SORT_KEYS = ['newest', 'oldest', 'total-desc', 'total-asc', 'customer'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/** Filters chosen on the orders page. */
export interface OrderFilters {
  search: string;
  status: OrderStatus | 'all';
}

/** Narrows an untrusted string to a status filter. */
export function toStatusFilter(value: string): OrderStatus | 'all' {
  return (ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : 'all';
}

/** Narrows an untrusted string to a sort key. */
export function toSortKey(value: string): SortKey {
  return (SORT_KEYS as readonly string[]).includes(value) ? (value as SortKey) : 'newest';
}

/** Orders matching the status and a case-insensitive search on id or customer. */
export function filterOrders(orders: readonly Order[], { search, status }: OrderFilters): Order[] {
  const needle = search.trim().toLowerCase().slice(0, 60);
  return orders.filter(
    (order) =>
      (status === 'all' || order.status === status) &&
      (!needle ||
        order.id.toLowerCase().includes(needle) ||
        order.customer.toLowerCase().includes(needle)),
  );
}

/** Returns a sorted copy (never mutates the input). */
export function sortOrders(orders: readonly Order[], sort: SortKey): Order[] {
  const byDate = (a: Order, b: Order) => a.createdAt.localeCompare(b.createdAt);
  const compare: Record<SortKey, (a: Order, b: Order) => number> = {
    newest: (a, b) => byDate(b, a),
    oldest: byDate,
    'total-desc': (a, b) => b.total - a.total || byDate(b, a),
    'total-asc': (a, b) => a.total - b.total || byDate(b, a),
    customer: (a, b) => a.customer.localeCompare(b.customer) || byDate(b, a),
  };
  return [...orders].sort(compare[sort]);
}

/** One page of results plus the numbers needed for pagination controls. */
export interface Page<T> {
  items: T[];
  /** 1-based page number, clamped to the valid range. */
  page: number;
  pageCount: number;
  total: number;
}

/** Slices `items` into a page; out-of-range pages are clamped. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    total: items.length,
  };
}
