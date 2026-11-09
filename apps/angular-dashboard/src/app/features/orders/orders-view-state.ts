/**
 * @file orders-view-state.ts
 * Filters, sort and page of the orders table, kept in a root service so they
 * survive a visit to an order's detail page and back.
 */
import { Injectable, signal } from '@angular/core';
import type { OrderStatus } from '../../data/orders';
import type { SortKey } from '../../data/order-query';

/** Rows per page. */
export const PAGE_SIZE = 10;

@Injectable({ providedIn: 'root' })
export class OrdersViewState {
  readonly search = signal('');
  readonly status = signal<OrderStatus | 'all'>('all');
  readonly sort = signal<SortKey>('newest');
  readonly page = signal(1);

  /** Back to the unfiltered first page. */
  clear(): void {
    this.search.set('');
    this.status.set('all');
    this.page.set(1);
  }
}
