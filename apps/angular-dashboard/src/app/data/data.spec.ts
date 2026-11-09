/**
 * @file data.spec.ts
 * Pure data logic: order generator, filter/sort/paging, KPIs, pricing and the
 * RxJS live feed (virtual time with TestScheduler).
 */
import { TestScheduler } from 'rxjs/testing';
import { computeKpis, dailySeries, dateKey, lastDays, ordersInLastDays } from './kpi';
import { liveFeed } from './live-feed';
import { filterOrders, paginate, sortOrders, toSortKey, toStatusFilter } from './order-query';
import { generateOrders, seededRandom, type Order } from './orders';
import { DEFAULT_PRICING, isValidPricing, parsePricing, priceOrder } from './pricing';

const NOW = new Date(2026, 10, 9, 12, 0, 0).getTime();
const orders = generateOrders({ count: 40, seed: 7, now: NOW, settings: DEFAULT_PRICING });

/** Minimal order for hand-written cases. */
function order(patch: Partial<Order>): Order {
  return {
    id: 'ORD-0001',
    customer: 'Ayu A.',
    channel: 'web',
    status: 'paid',
    createdAt: new Date(NOW).toISOString(),
    items: [],
    subtotal: 100_000,
    tax: 11_000,
    delivery: 10_000,
    total: 121_000,
    ...patch,
  };
}

describe('order generator', () => {
  it('is deterministic for the same seed', () => {
    const again = generateOrders({ count: 40, seed: 7, now: NOW, settings: DEFAULT_PRICING });
    expect(again).toEqual(orders);
    expect(seededRandom(1)()).toBe(seededRandom(1)());
  });

  it('creates unique ids, newest first, with consistent totals', () => {
    expect(new Set(orders.map((o) => o.id)).size).toBe(orders.length);
    const dates = orders.map((o) => o.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const o of orders) {
      const subtotal = o.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      expect(o.subtotal).toBe(subtotal);
      expect(o.total).toBe(o.subtotal + o.tax + o.delivery);
    }
  });
});

describe('order query', () => {
  it('filters by status and searches id or customer (case-insensitive)', () => {
    const list = [
      order({ id: 'ORD-1', customer: 'Bima B.' }),
      order({ id: 'ORD-2', status: 'cancelled' }),
    ];
    expect(filterOrders(list, { search: '', status: 'cancelled' }).map((o) => o.id)).toEqual([
      'ORD-2',
    ]);
    expect(filterOrders(list, { search: 'bima', status: 'all' }).map((o) => o.id)).toEqual([
      'ORD-1',
    ]);
    expect(filterOrders(list, { search: 'ord-2', status: 'all' })).toHaveLength(1);
  });

  it('sorts without mutating the input', () => {
    const list = [order({ id: 'A', total: 5 }), order({ id: 'B', total: 9 })];
    const copy = [...list];
    expect(sortOrders(list, 'total-desc').map((o) => o.id)).toEqual(['B', 'A']);
    expect(sortOrders(list, 'total-asc').map((o) => o.id)).toEqual(['A', 'B']);
    expect(list).toEqual(copy);
  });

  it('paginates and clamps out-of-range pages', () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(paginate(items, 1, 10)).toMatchObject({ page: 1, pageCount: 3, total: 23 });
    expect(paginate(items, 3, 10).items).toEqual([20, 21, 22]);
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, -4, 10).page).toBe(1);
    expect(paginate([], 1, 10)).toMatchObject({ page: 1, pageCount: 1, total: 0 });
  });

  it('rejects unknown filter and sort values', () => {
    expect(toStatusFilter('<script>')).toBe('all');
    expect(toStatusFilter('paid')).toBe('paid');
    expect(toSortKey('drop table')).toBe('newest');
  });
});

describe('KPIs', () => {
  it('excludes cancelled orders from revenue and average', () => {
    const kpis = computeKpis([
      order({ total: 100 }),
      order({ total: 300 }),
      order({ total: 999, status: 'cancelled' }),
    ]);
    expect(kpis).toEqual({
      revenue: 400,
      orders: 3,
      averageOrderValue: 200,
      cancellationRate: 1 / 3,
    });
    expect(computeKpis([])).toEqual({
      revenue: 0,
      orders: 0,
      averageOrderValue: 0,
      cancellationRate: 0,
    });
  });

  it('builds a 7-day series with empty days as zero', () => {
    const now = new Date(NOW);
    const days = lastDays(7, now);
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toBe(dateKey(now));
    const series = dailySeries([order({ total: 50 })], 7, now);
    expect(series.at(-1)).toEqual({ date: dateKey(now), revenue: 50, orders: 1 });
    expect(series.slice(0, 6).every((point) => point.orders === 0)).toBe(true);
  });

  it('keeps only orders from the window', () => {
    const old = order({ createdAt: new Date(NOW - 30 * 86_400_000).toISOString() });
    expect(ordersInLastDays([old, order({})], 7, new Date(NOW))).toHaveLength(1);
  });
});

describe('pricing', () => {
  it('taxes the subtotal and applies the free-delivery threshold', () => {
    expect(priceOrder(100_000, DEFAULT_PRICING)).toEqual({
      subtotal: 100_000,
      tax: 11_000,
      delivery: 10_000,
      total: 121_000,
    });
    expect(priceOrder(150_000, DEFAULT_PRICING).delivery).toBe(0);
    expect(priceOrder(500_000, { ...DEFAULT_PRICING, freeDeliveryFrom: 0 }).delivery).toBe(10_000);
  });

  it('validates rules and falls back to defaults for bad stored data', () => {
    expect(isValidPricing(DEFAULT_PRICING)).toBe(true);
    expect(isValidPricing({ ...DEFAULT_PRICING, taxPercent: 30 })).toBe(false);
    expect(isValidPricing({ ...DEFAULT_PRICING, taxPercent: 11.123 })).toBe(false);
    expect(isValidPricing({ ...DEFAULT_PRICING, freeDeliveryFrom: 5_000 })).toBe(false);
    expect(parsePricing({ taxPercent: '11', deliveryFee: 1, freeDeliveryFrom: 0 })).toEqual(
      DEFAULT_PRICING,
    );
    expect(parsePricing('garbage')).toEqual(DEFAULT_PRICING);
  });
});

describe('live feed (RxJS)', () => {
  it('emits only while active, counts items and restarts the timer on resume', () => {
    const scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
    scheduler.run(({ cold, expectObservable }) => {
      let n = 0;
      const active$ = cold('a 9ms b 4ms c', { a: true, b: false, c: true });
      const feed$ = liveFeed(active$, 3, () => `order-${++n}`, scheduler);
      // true at 0 → ticks at 3, 6, 9; false at 10; true at 15 → tick at 18 …
      expectObservable(feed$, '^ 20ms !').toBe('3ms a 2ms b 2ms c 8ms d', {
        a: { item: 'order-1', count: 1 },
        b: { item: 'order-2', count: 2 },
        c: { item: 'order-3', count: 3 },
        d: { item: 'order-4', count: 4 },
      });
    });
  });
});
