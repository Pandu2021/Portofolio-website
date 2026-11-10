/**
 * @file invoiceForm.test.ts
 * Parsing what people type and converting between form text and invoices.
 */
import { describe, expect, it } from 'vitest';
import { demoInvoices } from '../data/demo';
import { DEFAULT_PRICING } from './invoice';
import {
  fromForm,
  newInvoiceForm,
  parseDecimal,
  parseWhole,
  problemFieldId,
  toForm,
} from './invoiceForm';
import { must } from '../test/must';

describe('parsing typed numbers', () => {
  it.each([
    ['12', 12],
    [' 12.5 ', 12.5],
    ['12,5', 12.5],
    ['1 000', 1000],
    ['0', 0],
  ])('parseDecimal(%j) = %d', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it.each(['', 'abc', '-1', '1.234', '1e3', '12.'])('parseDecimal(%j) is NaN', (text) => {
    expect(parseDecimal(text)).toBeNaN();
  });

  it('parseWhole accepts whole numbers only', () => {
    expect(parseWhole('42')).toBe(42);
    expect(parseWhole('4.2')).toBeNaN();
    expect(parseWhole('')).toBeNaN();
  });
});

describe('toForm / fromForm', () => {
  it('round-trips every demo invoice without changes', () => {
    for (const invoice of demoInvoices()) {
      const { invoice: back, problems } = fromForm(toForm(invoice));
      expect(problems).toEqual([]);
      expect(back).toEqual(invoice);
    }
  });

  it('converts rupiah, percent and fixed discounts', () => {
    const form = newInvoiceForm([], DEFAULT_PRICING);
    form.customer = '  Example Co. ';
    form.lines = [
      { id: 'a', description: 'Box', quantity: '3', unitPrice: '12500,50', discount: '10' },
    ];
    form.discountType = 'amount';
    form.discountValue = '1000';
    form.taxRate = '12';
    const { invoice, problems } = fromForm(form);
    expect(problems).toEqual([]);
    expect(invoice.customer).toBe('Example Co.');
    expect(invoice.lines[0]).toEqual({
      id: 'a',
      description: 'Box',
      quantity: 3,
      unitPrice: 1_250_050,
      discountBp: 1_000,
    });
    expect(invoice.discount).toEqual({ type: 'amount', value: 100_000 });
    expect(invoice.pricing.taxRateBp).toBe(1_200);
  });

  it('a new form has an empty price so people type it', () => {
    expect(newInvoiceForm([], DEFAULT_PRICING).lines[0]?.unitPrice).toBe('');
  });

  it('reports unparsable or out-of-range rates', () => {
    const form = toForm(must(demoInvoices()[0], 'demo invoice'));
    form.taxRate = '60';
    form.serviceFee = 'abc';
    must(form.lines[0], 'first line').quantity = '1.5';
    const fields = fromForm(form).problems.map((problem) => problem.field);
    expect(fields).toEqual(expect.arrayContaining(['taxRate', 'serviceFee', 'quantity']));
  });

  it('maps problems to the ids of their inputs', () => {
    expect(problemFieldId({ field: 'customer', reason: 'required' })).toBe('field-customer');
    expect(problemFieldId({ field: 'unitPrice', line: 2, reason: 'range' })).toBe(
      'line-2-unitPrice',
    );
  });
});
