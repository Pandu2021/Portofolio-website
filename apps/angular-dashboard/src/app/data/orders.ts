/**
 * @file orders.ts
 * Mock order model and a deterministic generator (seeded random numbers), so
 * the demo always shows believable data and tests are repeatable.
 * Customers are fictional first names with an initial; no real people.
 */
import type { Locale } from '../core/i18n/messages';
import { priceOrder, type PricingSettings } from './pricing';

export const ORDER_STATUSES = ['pending', 'paid', 'preparing', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderChannel = 'web' | 'partner';

/** One product line of an order. */
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/** A (fictional) customer order. */
export interface Order {
  id: string;
  customer: string;
  channel: OrderChannel;
  status: OrderStatus;
  /** ISO timestamp. */
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery: number;
  total: number;
}

/** Demo menu used to build order lines. */
export const MENU: Readonly<Record<string, { name: Record<Locale, string>; price: number }>> = {
  'palm-sugar-latte': {
    name: { en: 'Palm Sugar Iced Latte', id: 'Es Kopi Susu Gula Aren' },
    price: 28_000,
  },
  cappuccino: { name: { en: 'Cappuccino', id: 'Cappuccino' }, price: 32_000 },
  'matcha-latte': { name: { en: 'Matcha Latte', id: 'Matcha Latte' }, price: 34_000 },
  'butter-croissant': { name: { en: 'Butter Croissant', id: 'Croissant Mentega' }, price: 26_000 },
  'banana-choco-bread': {
    name: { en: 'Banana Chocolate Bread', id: 'Roti Pisang Cokelat' },
    price: 24_000,
  },
  'special-fried-rice': {
    name: { en: 'Special Fried Rice', id: 'Nasi Goreng Spesial' },
    price: 45_000,
  },
  'chicken-noodles': { name: { en: 'Chicken Noodles', id: 'Mie Ayam' }, price: 38_000 },
  'chicken-satay': { name: { en: 'Chicken Satay', id: 'Sate Ayam' }, price: 42_000 },
};

const PRODUCT_IDS = Object.keys(MENU);
const FIRST_NAMES = [
  'Ayu',
  'Bima',
  'Citra',
  'Dewi',
  'Eka',
  'Fajar',
  'Gita',
  'Hadi',
  'Intan',
  'Joko',
  'Kirana',
  'Lukas',
  'Maya',
  'Nanda',
  'Oka',
  'Putri',
  'Raka',
  'Sari',
  'Tono',
  'Wulan',
];

/** Mulberry32: tiny seeded PRNG returning numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks an array element with the given random source. */
function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

/** Weighted status: most historic orders are delivered. */
function randomStatus(random: () => number, ageHours: number): OrderStatus {
  const roll = random();
  if (ageHours < 2) return roll < 0.5 ? 'pending' : roll < 0.8 ? 'paid' : 'preparing';
  if (roll < 0.08) return 'cancelled';
  if (ageHours < 6 && roll < 0.3) return 'preparing';
  return 'delivered';
}

/** Parameters for one generated order. */
export interface CreateOrderOptions {
  sequence: number;
  createdAt: Date;
  random: () => number;
  settings: PricingSettings;
  /** Status override (live orders always start as "pending"). */
  status?: OrderStatus;
  /** Reference time (ms) used to pick a realistic status for the order's age. */
  now?: number;
}

/** Builds one order with 1–3 product lines and a priced total. */
export function createOrder({
  sequence,
  createdAt,
  random,
  settings,
  status,
  now = createdAt.getTime(),
}: CreateOrderOptions): Order {
  const lineCount = 1 + Math.floor(random() * 3);
  const items: OrderItem[] = [];
  for (let i = 0; i < lineCount; i++) {
    const productId = pick(PRODUCT_IDS, random);
    if (items.some((item) => item.productId === productId)) continue;
    const product = MENU[productId];
    if (!product) continue;
    items.push({ productId, quantity: 1 + Math.floor(random() * 3), unitPrice: product.price });
  }
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const ageHours = (now - createdAt.getTime()) / 3_600_000;
  return {
    id: `ORD-${String(sequence).padStart(4, '0')}`,
    customer: `${pick(FIRST_NAMES, random)} ${String.fromCharCode(65 + Math.floor(random() * 26))}.`,
    channel: random() < 0.25 ? 'partner' : 'web',
    status: status ?? randomStatus(random, ageHours),
    createdAt: createdAt.toISOString(),
    items,
    ...priceOrder(subtotal, settings),
  };
}

/** Options for a batch of historic orders. */
export interface GenerateOrdersOptions {
  count: number;
  seed: number;
  /** Reference "now" (ms); orders are spread over the 14 days before it. */
  now: number;
  settings: PricingSettings;
}

/** Generates `count` historic orders, newest first. */
export function generateOrders({ count, seed, now, settings }: GenerateOrdersOptions): Order[] {
  const random = seededRandom(seed);
  const spanMs = 14 * 24 * 3_600_000;
  const times = Array.from({ length: count }, () => now - Math.floor(random() * spanMs)).sort(
    (a, b) => a - b,
  );
  return times
    .map((time, index) =>
      createOrder({ sequence: 1001 + index, createdAt: new Date(time), random, settings, now }),
    )
    .reverse();
}
