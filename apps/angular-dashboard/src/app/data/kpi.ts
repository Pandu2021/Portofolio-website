/**
 * @file kpi.ts
 * Finance KPIs and daily series for the overview charts (pure functions).
 * Cancelled orders never count as revenue.
 */
import type { Order } from './orders';

/** Headline numbers for a period. */
export interface Kpis {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  /** Cancelled ÷ all orders, 0–1. */
  cancellationRate: number;
}

/** One day in a chart. */
export interface DailyPoint {
  /** Local date as `YYYY-MM-DD`. */
  date: string;
  revenue: number;
  orders: number;
}

/** Local calendar date key (`YYYY-MM-DD`) of a timestamp. */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Calculates the KPIs of a set of orders. */
export function computeKpis(orders: readonly Order[]): Kpis {
  const billable = orders.filter((order) => order.status !== 'cancelled');
  const revenue = billable.reduce((sum, order) => sum + order.total, 0);
  return {
    revenue,
    orders: orders.length,
    averageOrderValue: billable.length ? Math.round(revenue / billable.length) : 0,
    cancellationRate: orders.length ? (orders.length - billable.length) / orders.length : 0,
  };
}

/** Orders created within the last `days` calendar days (including today). */
export function ordersInLastDays(orders: readonly Order[], days: number, now: Date): Order[] {
  const keys = new Set(lastDays(days, now));
  return orders.filter((order) => keys.has(dateKey(new Date(order.createdAt))));
}

/** The last `days` date keys, oldest first. */
export function lastDays(days: number, now: Date): string[] {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - index));
    return dateKey(day);
  });
}

/** Revenue and order count per day for the last `days` days (empty days = 0). */
export function dailySeries(orders: readonly Order[], days: number, now: Date): DailyPoint[] {
  const points = new Map(
    lastDays(days, now).map((date) => [date, { date, revenue: 0, orders: 0 }]),
  );
  for (const order of orders) {
    const point = points.get(dateKey(new Date(order.createdAt)));
    if (!point) continue;
    point.orders += 1;
    if (order.status !== 'cancelled') point.revenue += order.total;
  }
  return [...points.values()];
}
