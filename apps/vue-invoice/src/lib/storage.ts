/**
 * @file storage.ts
 * Saves invoices and settings in localStorage — and treats what it reads back
 * as UNTRUSTED: anything that does not match the schema is dropped, so a
 * tampered or outdated value can never break the app or inject odd data.
 */
import {
  DEFAULT_SETTINGS,
  INVOICE_STATUSES,
  MAX_TEXT,
  type AppSettings,
  type Invoice,
  type InvoiceLine,
} from './invoice';
import { LIMITS, type InvoiceDiscount, type PricingSettings } from './pricing';

export const STORAGE_KEY = 'vue-invoice-state-v1';

export interface StoredState {
  invoices: Invoice[];
  settings: AppSettings;
}

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isIntIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const isText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max;
const isDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

function readPricing(value: unknown): PricingSettings | null {
  if (!isObject(value)) return null;
  const { taxRateBp, serviceFeeBp, taxMode, roundingStep } = value;
  if (!isIntIn(taxRateBp, 0, 5_000) || !isIntIn(serviceFeeBp, 0, 3_000)) return null;
  if (taxMode !== 'exclusive' && taxMode !== 'inclusive') return null;
  if (roundingStep !== 1 && roundingStep !== 100) return null;
  return { taxRateBp, serviceFeeBp, taxMode, roundingStep };
}

function readDiscount(value: unknown): InvoiceDiscount | null {
  if (!isObject(value)) return null;
  if (value['type'] === 'percent' && isIntIn(value['value'], 0, 10_000)) {
    return { type: 'percent', value: value['value'] };
  }
  if (value['type'] === 'amount' && isIntIn(value['value'], 0, Number.MAX_SAFE_INTEGER)) {
    return { type: 'amount', value: value['value'] };
  }
  return null;
}

function readLine(value: unknown): InvoiceLine | null {
  if (!isObject(value)) return null;
  const { id, description, quantity, unitPrice, discountBp } = value;
  if (!isText(id, 64) || !isText(description, MAX_TEXT.description)) return null;
  if (!isIntIn(quantity, 1, LIMITS.maxQuantity)) return null;
  if (!isIntIn(unitPrice, 0, LIMITS.maxUnitPrice) || !isIntIn(discountBp, 0, 10_000)) return null;
  return { id, description, quantity, unitPrice, discountBp };
}

/** Returns a valid invoice, or null when any part is malformed. */
export function readInvoice(value: unknown): Invoice | null {
  if (!isObject(value)) return null;
  const { id, number, customer, issueDate, dueDate, status, lines, notes } = value;
  if (!isText(id, 64) || !isText(number, 32) || !isText(customer, MAX_TEXT.customer)) return null;
  if (!isDate(issueDate) || !isDate(dueDate) || !isText(notes, MAX_TEXT.notes)) return null;
  if (typeof status !== 'string' || !(INVOICE_STATUSES as readonly string[]).includes(status)) {
    return null;
  }
  if (!Array.isArray(lines) || lines.length > LIMITS.maxLines) return null;
  const parsedLines = lines.map(readLine);
  if (parsedLines.some((line) => line === null)) return null;
  const discount = readDiscount(value['discount']);
  const pricing = readPricing(value['pricing']);
  if (!discount || !pricing) return null;
  return {
    id,
    number,
    customer,
    issueDate,
    dueDate,
    status: status as Invoice['status'],
    lines: parsedLines as InvoiceLine[],
    discount,
    pricing,
    notes,
  };
}

/** Reads the saved state. Malformed invoices are skipped; malformed settings fall back to defaults. */
export function loadState(storage: Pick<Storage, 'getItem'> | undefined): StoredState | null {
  let raw: string | null;
  try {
    raw = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null; // storage blocked (private mode, policy)
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(parsed) || !Array.isArray(parsed['invoices'])) return null;
  const invoices = parsed['invoices']
    .slice(0, 200)
    .map(readInvoice)
    .filter((invoice): invoice is Invoice => invoice !== null);
  const settingsValue = parsed['settings'];
  const pricing = isObject(settingsValue) ? readPricing(settingsValue['pricing']) : null;
  const currency =
    isObject(settingsValue) &&
    (settingsValue['currency'] === 'USD' || settingsValue['currency'] === 'IDR')
      ? settingsValue['currency']
      : DEFAULT_SETTINGS.currency;
  return { invoices, settings: { pricing: pricing ?? DEFAULT_SETTINGS.pricing, currency } };
}

/** Saves the state; failures (quota, blocked storage) are ignored — the demo keeps working. */
export function saveState(storage: Pick<Storage, 'setItem'> | undefined, state: StoredState): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: changes stay for this visit only.
  }
}
