/**
 * @file invoice.test.ts
 * Numbering, dates, defaults, duplication and validation of invoices.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICING,
  addDays,
  createInvoice,
  duplicateInvoice,
  isIsoDate,
  nextInvoiceNumber,
  todayIso,
  validateInvoice,
  type Invoice,
} from './invoice';

const NOW = new Date('2026-11-10T09:00:00Z');

function validInvoice(): Invoice {
  const invoice = createInvoice([], DEFAULT_PRICING, NOW);
  invoice.customer = 'Example Co.';
  invoice.lines = [
    { id: 'a', description: 'Design', quantity: 1, unitPrice: 100_000_00, discountBp: 0 },
  ];
  return invoice;
}

describe('nextInvoiceNumber', () => {
  it('starts at 0001 and continues after the highest number of the year', () => {
    expect(nextInvoiceNumber([], 2026)).toBe('INV-2026-0001');
    expect(nextInvoiceNumber(['INV-2026-0001', 'INV-2026-0007', 'INV-2026-0003'], 2026)).toBe(
      'INV-2026-0008',
    );
  });

  it('restarts every year and ignores numbers in other formats', () => {
    expect(nextInvoiceNumber(['INV-2025-0042', 'ABC-1', 'INV-2026-x'], 2026)).toBe('INV-2026-0001');
  });

  it('grows past 9999', () => {
    expect(nextInvoiceNumber(['INV-2026-9999'], 2026)).toBe('INV-2026-10000');
  });
});

describe('dates', () => {
  it('adds days across months and leap years', () => {
    expect(addDays('2026-11-20', 14)).toBe('2026-12-04');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('validates real calendar dates only', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-2-3')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });

  it('todayIso returns YYYY-MM-DD', () => {
    expect(todayIso(NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('createInvoice / duplicateInvoice', () => {
  it('creates a draft with the next number, a due date 14 days later and copied rates', () => {
    const pricing = { ...DEFAULT_PRICING, serviceFeeBp: 500 };
    const invoice = createInvoice(['INV-2026-0003'], pricing, NOW);
    expect(invoice.number).toBe('INV-2026-0004');
    expect(invoice.status).toBe('draft');
    expect(invoice.dueDate).toBe(addDays(invoice.issueDate, 14));
    expect(invoice.lines).toHaveLength(1);
    expect(invoice.pricing).toEqual(pricing);
    expect(invoice.pricing).not.toBe(pricing); // a copy: later default changes do not leak in
  });

  it('duplicates lines, discount and rates as a new draft with new ids', () => {
    const source = { ...validInvoice(), status: 'paid' as const };
    const copy = duplicateInvoice(source, [source.number], NOW);
    expect(copy.id).not.toBe(source.id);
    expect(copy.number).toBe('INV-2026-0002');
    expect(copy.status).toBe('draft');
    expect(copy.customer).toBe(source.customer);
    expect(copy.lines.map((line) => line.description)).toEqual(['Design']);
    expect(copy.lines[0]?.id).not.toBe(source.lines[0]?.id);
  });
});

describe('validateInvoice', () => {
  it('accepts a complete invoice', () => {
    expect(validateInvoice(validInvoice())).toEqual([]);
  });

  it('reports every problem with a stable field key', () => {
    const invoice = validInvoice();
    invoice.customer = '  ';
    invoice.dueDate = '2000-01-01';
    invoice.lines = [{ id: 'x', description: '', quantity: 0, unitPrice: -1, discountBp: 20_000 }];
    invoice.discount = { type: 'percent', value: 20_000 };
    invoice.notes = 'x'.repeat(501);
    expect(validateInvoice(invoice)).toEqual([
      { field: 'customer', reason: 'required' },
      { field: 'dueDate', reason: 'beforeIssue' },
      { field: 'description', line: 0, reason: 'required' },
      { field: 'quantity', line: 0, reason: 'range' },
      { field: 'unitPrice', line: 0, reason: 'range' },
      { field: 'lineDiscount', line: 0, reason: 'range' },
      { field: 'discount', reason: 'range' },
      { field: 'notes', reason: 'tooLong' },
    ]);
  });

  it('checks invalid dates, empty and long fields', () => {
    const invoice = validInvoice();
    invoice.customer = 'x'.repeat(81);
    invoice.issueDate = 'tomorrow';
    invoice.dueDate = '2026-13-01';
    invoice.lines = [];
    expect(validateInvoice(invoice)).toEqual([
      { field: 'customer', reason: 'tooLong' },
      { field: 'issueDate', reason: 'invalid' },
      { field: 'dueDate', reason: 'invalid' },
      { field: 'lines', reason: 'empty' },
    ]);
  });

  it('limits the number of lines and the description length', () => {
    const invoice = validInvoice();
    const line = {
      id: 'l',
      description: 'x'.repeat(121),
      quantity: 1,
      unitPrice: 0,
      discountBp: 0,
    };
    invoice.lines = Array.from({ length: 51 }, () => line);
    const problems = validateInvoice(invoice);
    expect(problems).toContainEqual({ field: 'lines', reason: 'tooMany' });
    expect(problems).toContainEqual({ field: 'description', line: 0, reason: 'tooLong' });
  });
});
