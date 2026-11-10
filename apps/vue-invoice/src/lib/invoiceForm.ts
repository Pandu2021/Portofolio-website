/**
 * @file invoiceForm.ts
 * Converts between an {@link Invoice} (numbers in sen / basis points) and the
 * editor form (the raw text people type). Keeping the raw text means a field
 * never jumps or clears while someone is typing "12," — numbers are parsed
 * only for validation and totals. Both "1.5" and "1,5" are accepted.
 */
import { createInvoice, validateInvoice, type Invoice, type InvoiceProblem } from './invoice';
import {
  percentToBp,
  rupiahToSen,
  type InvoiceDiscount,
  type PricingSettings,
  type RoundingStep,
  type TaxMode,
} from './pricing';

export interface LineForm {
  id: string;
  description: string;
  quantity: string;
  /** Rupiah, as typed. */
  unitPrice: string;
  /** Percent, as typed. */
  discount: string;
}

export interface InvoiceForm {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  status: Invoice['status'];
  lines: LineForm[];
  discountType: InvoiceDiscount['type'];
  /** Percent or rupiah, as typed. */
  discountValue: string;
  serviceFee: string;
  taxRate: string;
  taxMode: TaxMode;
  roundingStep: RoundingStep;
  notes: string;
}

/**
 * Parses a non-negative decimal typed by a person ("12", "12.5", "12,5").
 * Returns NaN for anything else (empty, letters, more than 2 decimals).
 */
export function parseDecimal(text: string): number {
  const value = text.trim().replace(/\s/g, '');
  if (!/^\d{1,13}([.,]\d{1,2})?$/.test(value)) return Number.NaN;
  return Number(value.replace(',', '.'));
}

/** Parses a whole number typed by a person; NaN for anything else. */
export function parseWhole(text: string): number {
  const value = text.trim();
  return /^\d{1,6}$/.test(value) ? Number(value) : Number.NaN;
}

/** Formats a number for an input (no thousands separators, "." decimals). */
function plain(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

/** Invoice → form text. */
export function toForm(invoice: Invoice): InvoiceForm {
  const { discount, pricing } = invoice;
  return {
    id: invoice.id,
    number: invoice.number,
    customer: invoice.customer,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    lines: invoice.lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: String(line.quantity),
      unitPrice: plain(line.unitPrice / 100),
      discount: plain(line.discountBp / 100),
    })),
    discountType: discount.type,
    discountValue: plain(discount.value / 100),
    serviceFee: plain(pricing.serviceFeeBp / 100),
    taxRate: plain(pricing.taxRateBp / 100),
    taxMode: pricing.taxMode,
    roundingStep: pricing.roundingStep,
    notes: invoice.notes,
  };
}

/** Pricing settings from the form; NaN marks a field that does not parse. */
export function pricingFromForm(form: InvoiceForm): PricingSettings {
  return {
    taxRateBp: percentToBp(parseDecimal(form.taxRate)),
    serviceFeeBp: percentToBp(parseDecimal(form.serviceFee)),
    taxMode: form.taxMode,
    roundingStep: form.roundingStep,
  };
}

export type FormProblem =
  InvoiceProblem | { field: 'taxRate'; reason: 'range' } | { field: 'serviceFee'; reason: 'range' };

/** Form text → invoice, plus every validation problem (empty list = can be saved). */
export function fromForm(form: InvoiceForm): { invoice: Invoice; problems: FormProblem[] } {
  const pricing = pricingFromForm(form);
  const discountValue = parseDecimal(form.discountValue);
  const invoice: Invoice = {
    id: form.id,
    number: form.number,
    customer: form.customer.trim(),
    issueDate: form.issueDate,
    dueDate: form.dueDate,
    status: form.status,
    lines: form.lines.map((line) => ({
      id: line.id,
      description: line.description.trim(),
      quantity: parseWhole(line.quantity),
      unitPrice: rupiahToSen(parseDecimal(line.unitPrice)),
      discountBp: percentToBp(parseDecimal(line.discount)),
    })),
    discount:
      form.discountType === 'percent'
        ? { type: 'percent', value: percentToBp(discountValue) }
        : { type: 'amount', value: rupiahToSen(discountValue) },
    pricing,
    notes: form.notes.trim(),
  };

  const problems: FormProblem[] = validateInvoice(invoice);
  if (!Number.isSafeInteger(pricing.taxRateBp) || pricing.taxRateBp > 5_000) {
    problems.push({ field: 'taxRate', reason: 'range' });
  }
  if (!Number.isSafeInteger(pricing.serviceFeeBp) || pricing.serviceFeeBp > 3_000) {
    problems.push({ field: 'serviceFee', reason: 'range' });
  }
  return { invoice, problems };
}

/** A blank form for a new invoice. */
export function newInvoiceForm(
  existingNumbers: readonly string[],
  pricing: PricingSettings,
  now?: Date,
): InvoiceForm {
  const form = toForm(createInvoice(existingNumbers, pricing, now));
  // Show an empty price instead of "0" so people type it.
  form.lines = form.lines.map((line) => ({ ...line, unitPrice: '' }));
  return form;
}

/** Stable DOM id of the input behind a problem (used by the error summary links). */
export function problemFieldId(problem: FormProblem): string {
  return 'line' in problem ? `line-${problem.line}-${problem.field}` : `field-${problem.field}`;
}
