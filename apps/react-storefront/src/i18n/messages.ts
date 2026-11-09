/**
 * @file messages.ts
 * All UI text of the storefront in English and Indonesian.
 *
 * `id` is typed as `Messages` (the shape of `en`), so TypeScript fails the
 * build if a translation is missing or a parameter is different.
 * Functions are used for text with values (names, amounts).
 */

/** Supported languages. */
export type Locale = 'en' | 'id';

export const LOCALES: readonly Locale[] = ['en', 'id'];

/** BCP 47 tags for `<html lang>` and Intl formatting. */
export const LOCALE_TAG: Record<Locale, string> = { en: 'en-US', id: 'id-ID' };

const en = {
  brand: 'Kedai Demo',
  demoBanner: 'Demo store — fictional menu, no real orders or payments.',
  skipToContent: 'Skip to content',
  mainNav: 'Store navigation',
  navMenu: 'Menu',
  navCart: 'Cart',
  cartCount: (count: number) => `Cart, ${count} ${count === 1 ? 'item' : 'items'}`,
  backToPortfolio: 'Back to portfolio',
  languageLabel: 'Language',
  themeToggle: 'Change color theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',

  catalogTitle: 'Menu',
  catalogIntro: 'Coffee, tea, pastries and Indonesian favourites.',
  searchLabel: 'Search the menu',
  searchPlaceholder: 'e.g. latte, noodles',
  categoryLabel: 'Category',
  categoryAll: 'All',
  category: { coffee: 'Coffee', tea: 'Tea', pastry: 'Pastry', meal: 'Meals' },
  sortLabel: 'Sort by',
  sort: {
    featured: 'Featured',
    'price-asc': 'Price: low to high',
    'price-desc': 'Price: high to low',
    name: 'Name (A–Z)',
  },
  resultsCount: (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`,
  noResults: 'No items match your search.',
  clearFilters: 'Clear filters',

  addToCart: 'Add to cart',
  addNamedToCart: (name: string) => `Add ${name} to cart`,
  addedToCart: (name: string, quantity: number) => `${quantity} × ${name} added to the cart.`,
  productNotFound: 'Product not found',
  backToMenu: 'Back to menu',
  quantity: 'Quantity',
  increase: (name: string) => `Increase quantity of ${name}`,
  decrease: (name: string) => `Decrease quantity of ${name}`,

  cartTitle: 'Your cart',
  cartEmpty: 'Your cart is empty.',
  browseMenu: 'Browse the menu',
  each: 'each',
  remove: (name: string) => `Remove ${name}`,
  removed: (name: string) => `${name} removed from the cart.`,
  quantityChanged: (name: string, quantity: number) => `${name}: quantity ${quantity}.`,

  promoLabel: 'Promo code',
  promoApply: 'Apply',
  promoRemove: 'Remove code',
  promoHint: 'Try HEMAT10 or DEMO20K.',
  promoApplied: (code: string) => `Code ${code} applied.`,
  promoUnknown: 'This promo code does not exist.',
  promoMinimum: (minimum: string) => `This code needs a subtotal of at least ${minimum}.`,

  summaryTitle: 'Order summary',
  subtotal: 'Subtotal',
  discount: 'Discount',
  tax: 'Tax (11%)',
  delivery: 'Delivery',
  free: 'Free',
  total: 'Total',
  freeDeliveryHint: (amount: string) => `Add ${amount} more for free delivery.`,
  checkout: 'Go to checkout',

  checkoutTitle: 'Checkout',
  checkoutIntro: 'Demo form: nothing is sent or stored. It only shows validation.',
  checkoutEmpty: 'Your cart is empty — add something from the menu first.',
  fieldName: 'Full name',
  fieldEmail: 'Email',
  fieldAddress: 'Delivery address',
  fieldTime: 'Delivery time',
  timeAsap: 'As soon as possible',
  timeLunch: 'Lunch (12:00–13:00)',
  timeDinner: 'Dinner (18:00–19:00)',
  fieldPayment: 'Payment method (simulated)',
  paymentCard: 'Card',
  paymentTransfer: 'Bank transfer',
  fieldNotes: 'Notes (optional)',
  required: '(required)',
  errorRequired: (field: string) => `${field} is required.`,
  errorNameLength: 'Name must be 2–60 characters.',
  errorEmail: 'Enter a valid email address, for example name@example.com.',
  errorAddressLength: 'Address must be 10–200 characters.',
  errorNotesLength: 'Notes can be at most 200 characters.',
  errorSummary: (count: number) =>
    `Please fix ${count} ${count === 1 ? 'problem' : 'problems'} before placing the order:`,
  placeOrder: 'Place demo order',

  orderTitle: 'Order confirmed (demo)',
  orderNumber: (number: string) => `Order number: ${number}`,
  orderThanks: 'Thank you! This was a demo — no order was placed and no payment was taken.',
  continueShopping: 'Back to the menu',

  notFoundTitle: 'Page not found',
  footerNote: 'Built with React, TypeScript and Vite by Pandu Wicaksono.',
  sourceCode: 'Source code',
  opensInNewTab: '(opens in a new tab)',
};

/** The shape every translation must match. */
export type Messages = typeof en;

const id: Messages = {
  brand: 'Kedai Demo',
  demoBanner: 'Toko demo — menu fiktif, tanpa pesanan atau pembayaran sungguhan.',
  skipToContent: 'Langsung ke konten',
  mainNav: 'Navigasi toko',
  navMenu: 'Menu',
  navCart: 'Keranjang',
  cartCount: (count: number) => `Keranjang, ${count} item`,
  backToPortfolio: 'Kembali ke portofolio',
  languageLabel: 'Bahasa',
  themeToggle: 'Ganti tema warna',
  themeLight: 'Terang',
  themeDark: 'Gelap',
  themeSystem: 'Sistem',

  catalogTitle: 'Menu',
  catalogIntro: 'Kopi, teh, roti dan hidangan favorit Indonesia.',
  searchLabel: 'Cari menu',
  searchPlaceholder: 'mis. kopi, mie',
  categoryLabel: 'Kategori',
  categoryAll: 'Semua',
  category: { coffee: 'Kopi', tea: 'Teh', pastry: 'Roti & Kue', meal: 'Makanan' },
  sortLabel: 'Urutkan',
  sort: {
    featured: 'Unggulan',
    'price-asc': 'Harga: rendah ke tinggi',
    'price-desc': 'Harga: tinggi ke rendah',
    name: 'Nama (A–Z)',
  },
  resultsCount: (count: number) => `${count} menu`,
  noResults: 'Tidak ada menu yang cocok dengan pencarian.',
  clearFilters: 'Hapus filter',

  addToCart: 'Tambah ke keranjang',
  addNamedToCart: (name: string) => `Tambahkan ${name} ke keranjang`,
  addedToCart: (name: string, quantity: number) =>
    `${quantity} × ${name} ditambahkan ke keranjang.`,
  productNotFound: 'Produk tidak ditemukan',
  backToMenu: 'Kembali ke menu',
  quantity: 'Jumlah',
  increase: (name: string) => `Tambah jumlah ${name}`,
  decrease: (name: string) => `Kurangi jumlah ${name}`,

  cartTitle: 'Keranjang Anda',
  cartEmpty: 'Keranjang Anda masih kosong.',
  browseMenu: 'Lihat menu',
  each: 'per item',
  remove: (name: string) => `Hapus ${name}`,
  removed: (name: string) => `${name} dihapus dari keranjang.`,
  quantityChanged: (name: string, quantity: number) => `${name}: jumlah ${quantity}.`,

  promoLabel: 'Kode promo',
  promoApply: 'Pakai',
  promoRemove: 'Hapus kode',
  promoHint: 'Coba HEMAT10 atau DEMO20K.',
  promoApplied: (code: string) => `Kode ${code} dipakai.`,
  promoUnknown: 'Kode promo ini tidak ada.',
  promoMinimum: (minimum: string) => `Kode ini butuh subtotal minimal ${minimum}.`,

  summaryTitle: 'Ringkasan pesanan',
  subtotal: 'Subtotal',
  discount: 'Diskon',
  tax: 'Pajak (11%)',
  delivery: 'Ongkos kirim',
  free: 'Gratis',
  total: 'Total',
  freeDeliveryHint: (amount: string) => `Tambah ${amount} lagi untuk gratis ongkir.`,
  checkout: 'Lanjut ke checkout',

  checkoutTitle: 'Checkout',
  checkoutIntro:
    'Form demo: tidak ada data yang dikirim atau disimpan. Hanya menampilkan validasi.',
  checkoutEmpty: 'Keranjang Anda kosong — tambahkan menu terlebih dahulu.',
  fieldName: 'Nama lengkap',
  fieldEmail: 'Email',
  fieldAddress: 'Alamat pengiriman',
  fieldTime: 'Waktu pengiriman',
  timeAsap: 'Secepatnya',
  timeLunch: 'Makan siang (12.00–13.00)',
  timeDinner: 'Makan malam (18.00–19.00)',
  fieldPayment: 'Metode pembayaran (simulasi)',
  paymentCard: 'Kartu',
  paymentTransfer: 'Transfer bank',
  fieldNotes: 'Catatan (opsional)',
  required: '(wajib)',
  errorRequired: (field: string) => `${field} wajib diisi.`,
  errorNameLength: 'Nama harus 2–60 karakter.',
  errorEmail: 'Masukkan alamat email yang valid, contoh nama@example.com.',
  errorAddressLength: 'Alamat harus 10–200 karakter.',
  errorNotesLength: 'Catatan maksimal 200 karakter.',
  errorSummary: (count: number) => `Perbaiki ${count} masalah berikut sebelum memesan:`,
  placeOrder: 'Buat pesanan demo',

  orderTitle: 'Pesanan dikonfirmasi (demo)',
  orderNumber: (number: string) => `Nomor pesanan: ${number}`,
  orderThanks: 'Terima kasih! Ini hanya demo — tidak ada pesanan dibuat dan tidak ada pembayaran.',
  continueShopping: 'Kembali ke menu',

  notFoundTitle: 'Halaman tidak ditemukan',
  footerNote: 'Dibangun dengan React, TypeScript dan Vite oleh Pandu Wicaksono.',
  sourceCode: 'Kode sumber',
  opensInNewTab: '(membuka tab baru)',
};

/** Translations by locale. */
export const MESSAGES: Record<Locale, Messages> = { en, id };
