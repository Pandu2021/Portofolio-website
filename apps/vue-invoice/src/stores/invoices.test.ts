/**
 * @file invoices.test.ts
 * Pinia store: demo data on first visit, saving, duplicating, deleting,
 * status changes, settings, persistence and reset.
 */
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../lib/invoice';
import { STORAGE_KEY } from '../lib/storage';
import { must } from '../test/must';
import { useInvoiceStore } from './invoices';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('invoice store', () => {
  it('starts with the three demo invoices and default settings', () => {
    const store = useInvoiceStore();
    expect(store.numbers).toEqual(['INV-2026-0001', 'INV-2026-0002', 'INV-2026-0003']);
    expect(store.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('calculates totals of stored invoices', () => {
    const store = useInvoiceStore();
    const first = store.byId('demo-1');
    // Rp 2 500 000 + 40 × Rp 15 000 − 10 % = Rp 3 040 000, + 11 % tax = Rp 3 374 400
    expect(first && store.totalsOf(first).total).toBe(3_374_400_00);
  });

  it('saves new and changed invoices, and refuses invalid ones', () => {
    const store = useInvoiceStore();
    const invoice = { ...must(store.byId('demo-3'), 'demo-3'), id: 'new', number: 'INV-2026-0004' };
    store.save(invoice);
    expect(store.invoices[0]?.id).toBe('new');
    store.save({ ...invoice, customer: 'Renamed Co.' });
    expect(store.byId('new')?.customer).toBe('Renamed Co.');
    expect(store.invoices).toHaveLength(4);
    expect(() => store.save({ ...invoice, customer: '' })).toThrow('Invalid invoice');
  });

  it('duplicates, changes status and removes', () => {
    const store = useInvoiceStore();
    const copy = store.duplicate('demo-1');
    expect(copy?.number).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(copy?.status).toBe('draft');
    expect(store.duplicate('missing')).toBeUndefined();
    store.setStatus('demo-3', 'sent');
    expect(store.byId('demo-3')?.status).toBe('sent');
    store.remove('demo-2');
    expect(store.byId('demo-2')).toBeUndefined();
  });

  it('persists changes to localStorage and restores them in a new session', async () => {
    const store = useInvoiceStore();
    store.updateSettings({ ...DEFAULT_SETTINGS, currency: 'USD' });
    store.remove('demo-1');
    await nextTick();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"currency":"USD"');

    setActivePinia(createPinia()); // a fresh store reads the saved state
    const restored = useInvoiceStore();
    expect(restored.settings.currency).toBe('USD');
    expect(restored.byId('demo-1')).toBeUndefined();
  });

  it('reset brings back the samples and defaults', () => {
    const store = useInvoiceStore();
    store.remove('demo-1');
    store.updateSettings({ ...DEFAULT_SETTINGS, currency: 'USD' });
    store.resetDemo();
    expect(store.invoices).toHaveLength(3);
    expect(store.settings).toEqual(DEFAULT_SETTINGS);
  });
});
