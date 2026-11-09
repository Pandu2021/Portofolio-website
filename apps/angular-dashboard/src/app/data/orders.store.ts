/**
 * @file orders.store.ts
 * In-memory order store (signals). Starts with generated historic orders;
 * live demo orders are added by the orders page (see its RxJS feed).
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { createOrder, generateOrders, seededRandom, type Order } from './orders';
import { DEFAULT_PRICING } from './pricing';
import { PricingSettingsService } from './pricing-settings.service';

/** Number of historic orders in the demo. */
export const SEED_ORDER_COUNT = 64;

/** All demo orders, newest first. */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly pricing = inject(PricingSettingsService);
  private readonly random = seededRandom(Date.now() & 0xffffffff);
  private sequence = 1001 + SEED_ORDER_COUNT;

  readonly orders = signal<Order[]>(
    generateOrders({
      count: SEED_ORDER_COUNT,
      seed: 2026,
      now: Date.now(),
      settings: DEFAULT_PRICING,
    }),
  );

  /** Lookup table id → order. */
  readonly byId = computed(() => new Map(this.orders().map((order) => [order.id, order])));

  /** Creates a new "pending" order priced with the CURRENT settings. */
  createLiveOrder(now = new Date()): Order {
    return createOrder({
      sequence: this.sequence++,
      createdAt: now,
      random: this.random,
      settings: this.pricing.settings(),
      status: 'pending',
    });
  }

  /** Adds an order at the top of the list. */
  add(order: Order): void {
    this.orders.update((orders) => [order, ...orders]);
  }
}
