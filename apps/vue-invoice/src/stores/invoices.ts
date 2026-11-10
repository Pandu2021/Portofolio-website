/**
 * @file invoices.ts
 * Pinia store (setup syntax): invoices and settings, persisted to
 * localStorage on every change and validated when read back (lib/storage).
 */
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { demoInvoices } from '../data/demo';
import {
  DEFAULT_SETTINGS,
  duplicateInvoice,
  validateInvoice,
  type AppSettings,
  type Invoice,
  type InvoiceStatus,
} from '../lib/invoice';
import { calculateTotals, type Totals } from '../lib/pricing';
import { loadState, saveState } from '../lib/storage';

/** localStorage, or undefined when the browser blocks it. */
function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

const cloneSettings = (settings: AppSettings): AppSettings => ({
  pricing: { ...settings.pricing },
  currency: settings.currency,
});

export const useInvoiceStore = defineStore('invoices', () => {
  const saved = loadState(browserStorage());
  const invoices = ref<Invoice[]>(saved?.invoices ?? demoInvoices());
  const settings = ref<AppSettings>(cloneSettings(saved?.settings ?? DEFAULT_SETTINGS));

  watch(
    [invoices, settings],
    () => saveState(browserStorage(), { invoices: invoices.value, settings: settings.value }),
    { deep: true },
  );

  /** Every invoice number in use (for the next number). */
  const numbers = computed(() => invoices.value.map((invoice) => invoice.number));

  function byId(id: string): Invoice | undefined {
    return invoices.value.find((invoice) => invoice.id === id);
  }

  /** Totals of a stored (always valid) invoice. */
  function totalsOf(invoice: Invoice): Totals {
    return calculateTotals(invoice.lines, invoice.discount, invoice.pricing);
  }

  /**
   * Inserts or replaces an invoice.
   * @throws Error when the invoice is invalid (the editor validates first).
   */
  function save(invoice: Invoice): void {
    if (validateInvoice(invoice).length > 0) throw new Error('Invalid invoice');
    const index = invoices.value.findIndex((item) => item.id === invoice.id);
    if (index === -1) invoices.value.unshift(invoice);
    else invoices.value.splice(index, 1, invoice);
  }

  /** Copies an invoice as a new draft; returns the copy. */
  function duplicate(id: string): Invoice | undefined {
    const source = byId(id);
    if (!source) return undefined;
    const copy = duplicateInvoice(source, numbers.value);
    invoices.value.unshift(copy);
    return copy;
  }

  function remove(id: string): void {
    invoices.value = invoices.value.filter((invoice) => invoice.id !== id);
  }

  function setStatus(id: string, status: InvoiceStatus): void {
    const invoice = byId(id);
    if (invoice) invoice.status = status;
  }

  function updateSettings(next: AppSettings): void {
    settings.value = cloneSettings(next);
  }

  /** Back to the sample invoices and default settings. */
  function resetDemo(): void {
    invoices.value = demoInvoices();
    settings.value = cloneSettings(DEFAULT_SETTINGS);
  }

  return {
    invoices,
    settings,
    numbers,
    byId,
    totalsOf,
    save,
    duplicate,
    remove,
    setStatus,
    updateSettings,
    resetDemo,
  };
});
