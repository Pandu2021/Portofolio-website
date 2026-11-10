/**
 * @file invoice.ts
 * Invoice domain types, defaults and small pure helpers (numbering, dates,
 * validation). Everything here is framework-free and unit-tested.
 */
import {
  LIMITS,
  type BasisPoints,
  type InvoiceDiscount,
  type PricingSettings,
  type Sen,
} from './pricing';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export const INVOICE_STATUSES: readonly InvoiceStatus[] = ['draft', 'sent', 'paid'];

export type DisplayCurrency = 'IDR' | 'USD';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Sen;
  discountBp: BasisPoints;
}

export interface Invoice {
  id: string;
  /** e.g. INV-2026-0001 */
  number: string;
  /** Fictional customer name. */
  customer: string;
  /** ISO dates, YYYY-MM-DD. */
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  discount: InvoiceDiscount;
  /**
   * Rates are copied from the defaults when the invoice is created, so
   * changing the defaults later never changes an invoice already issued.
   */
  pricing: PricingSettings;
  notes: string;
}

export interface AppSettings {
  /** Defaults for NEW invoices. */
  pricing: PricingSettings;
  /** How amounts are displayed (all calculations stay in rupiah). */
  currency: DisplayCurrency;
}

export const DEFAULT_PRICING: PricingSettings = {
  taxRateBp: 1_100, // 11 %
  serviceFeeBp: 0,
  taxMode: 'exclusive',
  roundingStep: 1,
};

export const DEFAULT_SETTINGS: AppSettings = { pricing: DEFAULT_PRICING, currency: 'IDR' };

export const MAX_TEXT = { customer: 80, description: 120, notes: 500 } as const;

/** Random id for invoices and lines (crypto-quality, no personal data). */
export function newId(): string {
  return crypto.randomUUID();
}

/** Today's date in the visitor's time zone, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Adds whole days to an ISO date (UTC arithmetic, no time-zone drift). */
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const NUMBER_PATTERN = /^INV-(\d{4})-(\d{4,})$/;

/**
 * Next invoice number for a year: INV-<year>-<4+ digit sequence>, one more
 * than the highest number already used that year.
 */
export function nextInvoiceNumber(existing: readonly string[], year: number): string {
  const highest = existing.reduce((max, number) => {
    const match = NUMBER_PATTERN.exec(number);
    return match && Number(match[1]) === year ? Math.max(max, Number(match[2])) : max;
  }, 0);
  return `INV-${year}-${String(highest + 1).padStart(4, '0')}`;
}

/** A new, empty line. */
export function emptyLine(): InvoiceLine {
  return { id: newId(), description: '', quantity: 1, unitPrice: 0, discountBp: 0 };
}

/** A new draft invoice using the default rates. */
export function createInvoice(
  existingNumbers: readonly string[],
  pricing: PricingSettings,
  now: Date = new Date(),
): Invoice {
  const issueDate = todayIso(now);
  return {
    id: newId(),
    number: nextInvoiceNumber(existingNumbers, Number(issueDate.slice(0, 4))),
    customer: '',
    issueDate,
    dueDate: addDays(issueDate, 14),
    status: 'draft',
    lines: [emptyLine()],
    discount: { type: 'percent', value: 0 },
    pricing: { ...pricing },
    notes: '',
  };
}

/** Copy of an invoice as a new draft with the next number and today's dates. */
export function duplicateInvoice(
  source: Invoice,
  existingNumbers: readonly string[],
  now: Date = new Date(),
): Invoice {
  const fresh = createInvoice(existingNumbers, source.pricing, now);
  return {
    ...fresh,
    customer: source.customer,
    lines: source.lines.map((line) => ({ ...line, id: newId() })),
    discount: { ...source.discount },
    notes: source.notes,
  };
}

/** Field-level validation problems (keys are stable ids used by the editor). */
export type InvoiceProblem =
  | { field: 'customer'; reason: 'required' | 'tooLong' }
  | { field: 'issueDate' | 'dueDate'; reason: 'invalid' }
  | { field: 'dueDate'; reason: 'beforeIssue' }
  | { field: 'lines'; reason: 'empty' | 'tooMany' }
  | { field: 'description'; line: number; reason: 'required' | 'tooLong' }
  | { field: 'quantity'; line: number; reason: 'range' }
  | { field: 'unitPrice'; line: number; reason: 'range' }
  | { field: 'lineDiscount'; line: number; reason: 'range' }
  | { field: 'discount'; reason: 'range' }
  | { field: 'notes'; reason: 'tooLong' };

const isIntIn = (value: number, min: number, max: number) =>
  Number.isSafeInteger(value) && value >= min && value <= max;

/** All problems that prevent saving (empty list = valid). */
export function validateInvoice(invoice: Invoice): InvoiceProblem[] {
  const problems: InvoiceProblem[] = [];
  const customer = invoice.customer.trim();
  if (!customer) problems.push({ field: 'customer', reason: 'required' });
  else if (customer.length > MAX_TEXT.customer)
    problems.push({ field: 'customer', reason: 'tooLong' });

  if (!isIsoDate(invoice.issueDate)) problems.push({ field: 'issueDate', reason: 'invalid' });
  if (!isIsoDate(invoice.dueDate)) problems.push({ field: 'dueDate', reason: 'invalid' });
  else if (isIsoDate(invoice.issueDate) && invoice.dueDate < invoice.issueDate) {
    problems.push({ field: 'dueDate', reason: 'beforeIssue' });
  }

  if (invoice.lines.length === 0) problems.push({ field: 'lines', reason: 'empty' });
  if (invoice.lines.length > LIMITS.maxLines) problems.push({ field: 'lines', reason: 'tooMany' });
  invoice.lines.forEach((line, index) => {
    const description = line.description.trim();
    if (!description) problems.push({ field: 'description', line: index, reason: 'required' });
    else if (description.length > MAX_TEXT.description) {
      problems.push({ field: 'description', line: index, reason: 'tooLong' });
    }
    if (!isIntIn(line.quantity, 1, LIMITS.maxQuantity)) {
      problems.push({ field: 'quantity', line: index, reason: 'range' });
    }
    if (!isIntIn(line.unitPrice, 0, LIMITS.maxUnitPrice)) {
      problems.push({ field: 'unitPrice', line: index, reason: 'range' });
    }
    if (!isIntIn(line.discountBp, 0, 10_000)) {
      problems.push({ field: 'lineDiscount', line: index, reason: 'range' });
    }
  });

  const { discount } = invoice;
  const discountOk =
    discount.type === 'percent'
      ? isIntIn(discount.value, 0, 10_000)
      : isIntIn(discount.value, 0, Number.MAX_SAFE_INTEGER);
  if (!discountOk) problems.push({ field: 'discount', reason: 'range' });

  if (invoice.notes.length > MAX_TEXT.notes) problems.push({ field: 'notes', reason: 'tooLong' });
  return problems;
}
