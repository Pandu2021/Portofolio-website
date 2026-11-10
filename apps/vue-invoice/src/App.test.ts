/**
 * @file App.test.ts
 * Component tests of the whole app (real router + Pinia, in-memory history):
 * creating an invoice, validation with a focused error summary, live totals,
 * tax mode, deleting with the dialog, language and page titles.
 */
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import App from './App.vue';
import { useI18n } from './i18n/useI18n';
import { createAppRouter } from './router';
import { useInvoiceStore } from './stores/invoices';
import { must } from './test/must';

let wrapper: VueWrapper | undefined;

beforeAll(() => {
  // jsdom has no modal dialogs yet: a minimal stand-in with the same API.
  const proto = HTMLDialogElement.prototype;
  if (typeof proto.showModal !== 'function' || !('open' in proto)) {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  useI18n().setLocale('en');
});

async function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory());
  const pinia = createPinia();
  await router.push(path);
  await router.isReady();
  wrapper = mount(App, { global: { plugins: [pinia, router] }, attachTo: document.body });
  await flushPromises();
  return { router, wrapper, store: useInvoiceStore(pinia) };
}

const normalise = (text: string) => text.replace(/\s+/g, ' ').trim();

describe('invoice list', () => {
  it('shows the demo invoices with their totals', async () => {
    const { wrapper } = await renderAt('/invoices');
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(normalise(must(rows[0], 'first row').text())).toContain('INV-2026-0001');
    expect(normalise(must(rows[0], 'first row').text())).toContain('IDR 3,374,400');
  });

  it('filters by status', async () => {
    const { wrapper } = await renderAt('/invoices');
    await wrapper.get('#status-filter').setValue('paid');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
  });

  it('deletes only after confirming in the dialog', async () => {
    const { wrapper, store } = await renderAt('/invoices');
    await wrapper.get('button[aria-label="Delete INV-2026-0002"]').trigger('click');
    await flushPromises();
    const dialog = wrapper.get('dialog');
    expect(dialog.attributes('open')).toBeDefined();
    expect(dialog.text()).toContain('Delete INV-2026-0002?');
    await dialog.get('.btn--danger').trigger('click');
    await flushPromises();
    expect(store.byId('demo-2')).toBeUndefined();
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
  });
});

describe('invoice editor', () => {
  it('creates an invoice with live totals and saves it', async () => {
    const { wrapper, router, store } = await renderAt('/invoices/new');
    expect(wrapper.get('h1').text()).toBe('New invoice');
    await wrapper.get('#field-customer').setValue('Example Co.');
    await wrapper.get('#line-0-description').setValue('Catering box');
    await wrapper.get('#line-0-quantity').setValue('2');
    await wrapper.get('#line-0-unitPrice').setValue('50000');
    expect(normalise(wrapper.get('[data-testid="grand-total"]').text())).toBe('IDR 111,000');

    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('list');
    expect(store.invoices[0]?.customer).toBe('Example Co.');
    expect(store.invoices[0]?.number).toBe(
      `INV-${new Date().getFullYear()}-${new Date().getFullYear() === 2026 ? '0004' : '0001'}`,
    );
  });

  it('switching to inclusive tax keeps the total and shows the included tax', async () => {
    const { wrapper } = await renderAt('/invoices/new');
    await wrapper.get('#line-0-description').setValue('Box');
    await wrapper.get('#line-0-unitPrice').setValue('111000');
    await wrapper.get('input[name="tax-mode"][value="inclusive"]').setValue(true);
    const totals = normalise(wrapper.get('.totals').text());
    expect(totals).toContain('Included tax (11%)');
    expect(normalise(wrapper.get('[data-testid="grand-total"]').text())).toBe('IDR 111,000');
  });

  it('shows a focused error summary linked to invalid fields', async () => {
    const { wrapper } = await renderAt('/invoices/new');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const summary = wrapper.get('.error-summary');
    expect(document.activeElement).toBe(summary.element);
    expect(summary.text()).toContain('Enter the customer name.');
    expect(summary.text()).toContain('Item 1: enter a description.');

    const customer = wrapper.get('#field-customer');
    expect(customer.attributes('aria-invalid')).toBe('true');
    expect(customer.attributes('aria-describedby')).toContain('field-customer-error');

    await summary.get('a').trigger('click');
    expect(document.activeElement).toBe(customer.element);
  });

  it('adds and removes items (the last item cannot be removed)', async () => {
    const { wrapper } = await renderAt('/invoices/new');
    expect(wrapper.get('button[aria-label="Remove item 1"]').attributes('disabled')).toBeDefined();
    await wrapper.get('#add-line').trigger('click');
    expect(wrapper.findAll('.line')).toHaveLength(2);
    await wrapper.get('button[aria-label="Remove item 2"]').trigger('click');
    expect(wrapper.findAll('.line')).toHaveLength(1);
  });

  it('shows "not found" for an unknown invoice id', async () => {
    const { wrapper } = await renderAt('/invoices/does-not-exist');
    expect(wrapper.get('h1').text()).toBe('Page not found');
  });
});

describe('language and titles', () => {
  it('switches to Indonesian: <html lang>, texts and tab title', async () => {
    const { wrapper } = await renderAt('/settings');
    expect(document.title).toContain('Settings');
    await wrapper.get('button[lang="id"]').trigger('click');
    await flushPromises();
    expect(document.documentElement.lang).toBe('id');
    expect(wrapper.get('h1').text()).toBe('Pengaturan');
    expect(document.title).toContain('Pengaturan');
    expect(wrapper.get('footer a').attributes('href')).toBe('../id/');
  });

  it('print view shows the invoice and a print button', async () => {
    const { wrapper } = await renderAt('/invoices/demo-2/print');
    expect(normalise(wrapper.get('h1').text())).toBe('Invoice INV-2026-0002');
    expect(wrapper.get('caption').text()).toBe('Items');
    expect(wrapper.text()).toContain('Print / Save as PDF');
  });
});
