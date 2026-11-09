/**
 * @file products.ts
 * Mock catalog for the storefront demo (fictional café menu, prices in IDR).
 * No real business, brand or customer data is used anywhere in this app.
 */
import type { Locale } from '../i18n/messages';

/** Menu categories, in display order. */
export const CATEGORIES = ['coffee', 'tea', 'pastry', 'meal'] as const;
export type Category = (typeof CATEGORIES)[number];

/** A product of the demo menu. */
export interface Product {
  id: string;
  category: Category;
  /** Price in Indonesian Rupiah (whole numbers). */
  price: number;
  /** Decorative emoji used as the product picture. */
  emoji: string;
  /** Lower number = shown first with the "Featured" sort. */
  rank: number;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'palm-sugar-latte',
    category: 'coffee',
    price: 28_000,
    emoji: '🧋',
    rank: 1,
    name: { en: 'Palm Sugar Iced Latte', id: 'Es Kopi Susu Gula Aren' },
    description: {
      en: 'Double espresso, fresh milk and smoky palm sugar over ice.',
      id: 'Double espresso, susu segar dan gula aren di atas es.',
    },
  },
  {
    id: 'cappuccino',
    category: 'coffee',
    price: 32_000,
    emoji: '☕',
    rank: 4,
    name: { en: 'Cappuccino', id: 'Cappuccino' },
    description: {
      en: 'Espresso with silky steamed milk and a thick foam cap.',
      id: 'Espresso dengan susu steam lembut dan busa tebal.',
    },
  },
  {
    id: 'cold-brew',
    category: 'coffee',
    price: 30_000,
    emoji: '🥤',
    rank: 7,
    name: { en: 'Cold Brew', id: 'Cold Brew' },
    description: {
      en: 'Coffee steeped for 16 hours — smooth, low acidity.',
      id: 'Kopi diseduh dingin 16 jam — lembut dan rendah asam.',
    },
  },
  {
    id: 'matcha-latte',
    category: 'tea',
    price: 34_000,
    emoji: '🍵',
    rank: 3,
    name: { en: 'Matcha Latte', id: 'Matcha Latte' },
    description: {
      en: 'Stone-ground green tea whisked with milk.',
      id: 'Teh hijau giling batu dikocok dengan susu.',
    },
  },
  {
    id: 'pulled-milk-tea',
    category: 'tea',
    price: 22_000,
    emoji: '🫖',
    rank: 8,
    name: { en: 'Pulled Milk Tea', id: 'Teh Tarik' },
    description: {
      en: 'Black tea and condensed milk, pulled until frothy.',
      id: 'Teh hitam dan susu kental manis, ditarik hingga berbusa.',
    },
  },
  {
    id: 'lemon-iced-tea',
    category: 'tea',
    price: 18_000,
    emoji: '🍋',
    rank: 10,
    name: { en: 'Lemon Iced Tea', id: 'Es Teh Lemon' },
    description: {
      en: 'Jasmine tea with fresh lemon and a touch of honey.',
      id: 'Teh melati dengan lemon segar dan sedikit madu.',
    },
  },
  {
    id: 'butter-croissant',
    category: 'pastry',
    price: 26_000,
    emoji: '🥐',
    rank: 2,
    name: { en: 'Butter Croissant', id: 'Croissant Mentega' },
    description: {
      en: 'Flaky, all-butter croissant baked every morning.',
      id: 'Croissant mentega renyah, dipanggang setiap pagi.',
    },
  },
  {
    id: 'banana-choco-bread',
    category: 'pastry',
    price: 24_000,
    emoji: '🍌',
    rank: 9,
    name: { en: 'Banana Chocolate Bread', id: 'Roti Pisang Cokelat' },
    description: {
      en: 'Moist banana loaf with dark chocolate chunks.',
      id: 'Roti pisang lembut dengan potongan cokelat hitam.',
    },
  },
  {
    id: 'cinnamon-roll',
    category: 'pastry',
    price: 27_000,
    emoji: '🥮',
    rank: 11,
    name: { en: 'Cinnamon Roll', id: 'Roti Kayu Manis' },
    description: {
      en: 'Soft roll swirled with cinnamon sugar and cream-cheese glaze.',
      id: 'Roti lembut dengan gula kayu manis dan glasir keju krim.',
    },
  },
  {
    id: 'special-fried-rice',
    category: 'meal',
    price: 45_000,
    emoji: '🍛',
    rank: 5,
    name: { en: 'Special Fried Rice', id: 'Nasi Goreng Spesial' },
    description: {
      en: 'Wok-fried rice with chicken, egg, crackers and pickles.',
      id: 'Nasi goreng dengan ayam, telur, kerupuk dan acar.',
    },
  },
  {
    id: 'chicken-noodles',
    category: 'meal',
    price: 38_000,
    emoji: '🍜',
    rank: 6,
    name: { en: 'Chicken Noodles', id: 'Mie Ayam' },
    description: {
      en: 'Springy noodles with savoury chicken, greens and broth.',
      id: 'Mie kenyal dengan ayam gurih, sayuran dan kuah kaldu.',
    },
  },
  {
    id: 'chicken-satay',
    category: 'meal',
    price: 42_000,
    emoji: '🍢',
    rank: 12,
    name: { en: 'Chicken Satay', id: 'Sate Ayam' },
    description: {
      en: 'Ten grilled skewers with peanut sauce and rice cakes.',
      id: 'Sepuluh tusuk sate panggang dengan saus kacang dan lontong.',
    },
  },
];

/** Lookup table: product id → product. */
export const PRODUCT_BY_ID: ReadonlyMap<string, Product> = new Map(
  PRODUCTS.map((product) => [product.id, product]),
);
