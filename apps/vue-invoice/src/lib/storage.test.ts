/**
 * @file storage.test.ts
 * Saved data is treated as untrusted: valid data round-trips, anything
 * malformed or tampered with is dropped safely.
 */
import { describe, expect, it } from 'vitest';
import { demoInvoices } from '../data/demo';
import { DEFAULT_SETTINGS } from './invoice';
import { STORAGE_KEY, loadState, readInvoice, saveState } from './storage';

function memoryStorage(initial?: string) {
  const data = new Map<string, string>(initial ? [[STORAGE_KEY, initial]] : []);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    raw: () => data.get(STORAGE_KEY),
  };
}

describe('storage', () => {
  it('round-trips the demo invoices and settings', () => {
    const storage = memoryStorage();
    const state = {
      invoices: demoInvoices(),
      settings: { ...DEFAULT_SETTINGS, currency: 'USD' as const },
    };
    saveState(storage, state);
    expect(loadState(storage)).toEqual(state);
  });

  it('returns null for missing, non-JSON or wrongly shaped data', () => {
    expect(loadState(memoryStorage())).toBeNull();
    expect(loadState(memoryStorage('{not json'))).toBeNull();
    expect(loadState(memoryStorage('[]'))).toBeNull();
    expect(loadState(memoryStorage('{"invoices":"x"}'))).toBeNull();
    expect(loadState(undefined)).toBeNull();
  });

  it('skips malformed invoices but keeps the valid ones', () => {
    const [valid] = demoInvoices();
    const tampered = { ...valid, id: 'evil', lines: [{ ...valid?.lines[0], unitPrice: -5 }] };
    const raw = JSON.stringify({
      invoices: [valid, tampered, 42, null],
      settings: DEFAULT_SETTINGS,
    });
    expect(loadState(memoryStorage(raw))?.invoices).toEqual([valid]);
  });

  it('falls back to default settings when they are malformed', () => {
    const raw = JSON.stringify({
      invoices: [],
      settings: { pricing: { taxRateBp: 9_999_999 }, currency: 'EUR' },
    });
    expect(loadState(memoryStorage(raw))?.settings).toEqual(DEFAULT_SETTINGS);
  });

  it.each([
    ['unknown status', { status: 'hacked' }],
    ['script in the number field (too long)', { number: '<img src=x onerror=alert(1)>'.repeat(3) }],
    ['bad date', { issueDate: 'yesterday' }],
    ['bad discount', { discount: { type: 'free', value: 1 } }],
    ['bad pricing', { pricing: { ...DEFAULT_SETTINGS.pricing, roundingStep: 7 } }],
    ['too many lines', { lines: Array.from({ length: 51 }, () => demoInvoices()[0]?.lines[0]) }],
  ])('rejects an invoice with %s', (_label, patch) => {
    expect(readInvoice({ ...demoInvoices()[0], ...patch })).toBeNull();
  });

  it('ignores storage that throws (blocked or full)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(loadState(throwing)).toBeNull();
    expect(() => saveState(throwing, { invoices: [], settings: DEFAULT_SETTINGS })).not.toThrow();
  });
});
