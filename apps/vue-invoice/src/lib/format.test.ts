/**
 * @file format.test.ts
 * Money, percent and date formatting in both languages.
 * (Intl output uses non-breaking spaces; they are normalised for readability.)
 */
import { describe, expect, it } from 'vitest';
import { DEMO_USD_RATE, formatDate, formatMoney, formatPercent } from './format';

const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('shows whole rupiah without decimals', () => {
    expect(plain(formatMoney(222_000_00, 'id'))).toBe('Rp 222.000');
    expect(plain(formatMoney(222_000_00, 'en'))).toBe('IDR 222,000');
  });

  it('shows two decimals when there are sen', () => {
    expect(plain(formatMoney(123_456, 'id'))).toBe('Rp 1.234,56');
    expect(plain(formatMoney(12_350, 'en'))).toBe('IDR 123.50');
  });

  it('converts to USD at the fixed demo rate', () => {
    expect(formatMoney(DEMO_USD_RATE * 100, 'en', 'USD')).toBe('$1.00');
    expect(plain(formatMoney(DEMO_USD_RATE * 250, 'id', 'USD'))).toBe('US$2,50');
  });
});

describe('formatPercent / formatDate', () => {
  it('formats basis points as a percentage', () => {
    expect(formatPercent(1_100, 'en')).toBe('11%');
    expect(formatPercent(250, 'en')).toBe('2.5%');
    expect(plain(formatPercent(250, 'id'))).toBe('2,5%');
  });

  it('formats ISO dates in UTC (no time-zone shift)', () => {
    expect(formatDate('2026-11-10', 'en')).toBe('Nov 10, 2026');
    expect(formatDate('2026-11-10', 'id')).toBe('10 Nov 2026');
  });
});
