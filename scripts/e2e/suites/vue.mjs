/**
 * @file vue.mjs
 * E2E checks for the Vue invoice & pricing tool: demo data, creating an
 * invoice with live totals (tax rate, rounding), validation, print view,
 * persistence, delete dialog (keyboard), status announcements, settings
 * (USD display), Indonesian language and mobile layout.
 * Everything happens in an isolated browser context (no server state).
 */
import { fillInput, horizontalOverflow, openPage, screenshot, sleep } from '../harness.mjs';

/** Visible text with non-breaking spaces normalised. */
const textOf = (page, selector) =>
  page.$eval(selector, (el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim());

/** Waits until the grand total shows `expected` (totals update reactively). */
async function totalIs(page, expected) {
  return page
    .waitForFunction(
      (want) =>
        document
          .querySelector('[data-testid="grand-total"]')
          ?.textContent?.replace(/\s+/g, ' ')
          .trim() === want,
      { timeout: 3000 },
      expected,
    )
    .then(
      () => true,
      () => false,
    );
}

/**
 * @param {{ browser: import('puppeteer-core').Browser, results: import('../harness.mjs').Results, base: string }} context
 */
export async function run({ browser, results, base }) {
  const app = `${base}vue/`;

  // 1. Desktop flow in English.
  {
    const view = await openPage(browser, app);
    const { page } = view;
    await page.waitForSelector('tbody tr');
    results.check(
      page.url().endsWith('#/invoices'),
      'opens on the invoice list (#/invoices)',
      page.url(),
    );
    results.check((await page.$$('tbody tr')).length === 3, 'shows the 3 demo invoices');
    results.check(
      await page.evaluate(() => document.documentElement.classList.contains('js')),
      'theme boot script ran before the app',
    );
    results.check((await page.$$('h1')).length === 1, 'exactly one H1');

    // Create an invoice: totals follow every change.
    await page.click('a.nav-link[href="#/invoices/new"]');
    await page.waitForSelector('#field-customer');
    await page.type('#field-customer', 'E2E Test Co. (fictional)');
    await page.type('#line-0-description', 'Consulting');
    await fillInput(page, '#line-0-quantity', '2');
    await page.type('#line-0-unitPrice', '50000');
    results.check(await totalIs(page, 'IDR 111,000'), 'total = 2 × Rp 50,000 + 11% tax');
    await fillInput(page, '#field-taxRate', '12');
    results.check(await totalIs(page, 'IDR 112,000'), 'changing the tax rate updates the total');
    await fillInput(page, '#line-0-unitPrice', '50049');
    results.check(await totalIs(page, 'IDR 112,110'), 'rounds the total to the nearest Rp 1');
    await page.click('input[name="rounding"][value="100"]');
    results.check(await totalIs(page, 'IDR 112,100'), 'rounding to Rp 100 is applied');
    results.check(
      (await textOf(page, '.totals')).includes('Rounding'),
      'the rounding adjustment is shown as its own row',
    );
    await screenshot(page, 'vue-editor-desktop');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => location.hash === '#/invoices');
    await page.waitForSelector('tr[data-invoice="INV-2026-0004"]');
    results.check(
      (await textOf(page, 'tr[data-invoice="INV-2026-0004"]')).includes('IDR 112,100'),
      'saved invoice appears in the list with its total (next number INV-2026-0004)',
    );

    // Validation: focused error summary, not hidden behind the sticky header.
    await page.click('a.nav-link[href="#/invoices/new"]');
    await page.waitForSelector('#field-customer');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.error-summary');
    await sleep(150);
    results.check(
      await page.evaluate(() => document.activeElement?.classList.contains('error-summary')),
      'error summary receives focus after an invalid save',
    );
    const unobscured = await page
      .waitForFunction(
        () => {
          const header = document.querySelector('.header')?.getBoundingClientRect();
          const summary = document.querySelector('.error-summary')?.getBoundingClientRect();
          return Boolean(header && summary && summary.top >= header.bottom);
        },
        { timeout: 3000, polling: 100 },
      )
      .then(
        () => true,
        () => false,
      );
    results.check(unobscured, 'error summary is not hidden behind the sticky header');
    results.check(
      (await page.$eval('#field-customer', (el) => el.getAttribute('aria-describedby'))).includes(
        'field-customer-error',
      ),
      'invalid field is linked to its error message (aria-describedby)',
    );

    // Print view.
    await page.goto(`${app}#/invoices`, { waitUntil: 'networkidle0' });
    await page.click('tr[data-invoice="INV-2026-0004"] a[aria-label="Print INV-2026-0004"]');
    await page.waitForSelector('.sheet');
    await page.evaluate(() => {
      window.__printed = 0;
      window.print = () => {
        window.__printed += 1;
      };
    });
    await page.click('.print-toolbar .btn--primary');
    results.check(
      (await page.evaluate(() => window.__printed)) === 1 &&
        (await textOf(page, 'h1')).includes('INV-2026-0004'),
      'print view opens the browser print dialog (window.print)',
    );
    results.check(
      (await page.$$eval('.sheet__items th[scope="col"]', (ths) => ths.length)) === 5,
      'items table has column headers (scope="col")',
    );
    await screenshot(page, 'vue-print-desktop');

    // Persistence after reload.
    await page.goto(`${app}#/invoices`, { waitUntil: 'networkidle0' });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr');
    results.check((await page.$$('tbody tr')).length === 4, 'invoices are kept after a reload');

    // Status change is announced in the live region (set after 60 ms).
    await page.select('select[aria-label="Status of INV-2026-0003"]', 'paid');
    const announced = await page
      .waitForFunction(
        () =>
          document
            .querySelector('[role="status"]')
            ?.textContent?.includes('INV-2026-0003 is now Paid'),
        { timeout: 2000 },
      )
      .then(
        () => true,
        () => false,
      );
    results.check(announced, 'status change is announced to screen readers');

    // Delete dialog: Escape cancels and focus returns; confirming deletes.
    const deleteSelector = 'button[aria-label="Delete INV-2026-0004"]';
    await page.click(deleteSelector);
    await page.waitForSelector('dialog[open]');
    results.check(
      await page.evaluate(() => document.activeElement?.closest('dialog') !== null),
      'delete dialog opens with focus inside it',
    );
    await page.keyboard.press('Escape');
    await sleep(150);
    results.check(
      !(await page.$('dialog[open]')) &&
        (await page.evaluate(
          (selector) => document.activeElement === document.querySelector(selector),
          deleteSelector,
        )),
      'Escape closes the dialog and focus returns to the delete button',
    );
    await page.click(deleteSelector);
    await page.waitForSelector('dialog[open]');
    await page.click('dialog[open] .btn--danger');
    await sleep(150);
    results.check(
      (await page.$$('tbody tr')).length === 3,
      'confirming the dialog deletes the invoice',
    );

    // Settings: USD display at the demo rate.
    await page.click('a.nav-link[href="#/settings"]');
    await page.waitForSelector('input[name="currency"][value="USD"]');
    await page.click('input[name="currency"][value="USD"]');
    await page.click('.settings button[type="submit"]');
    await page.click('a.nav-link[href="#/invoices"]');
    await page.waitForSelector('tbody tr');
    results.check(
      (await textOf(page, 'tbody tr:first-child')).includes('$'),
      'settings: amounts can be shown in USD (demo rate)',
    );

    const csp = await view.csp();
    results.check(csp.length === 0, 'no CSP violations during the flow', csp.join(' | '));
    results.check(
      view.errors.length === 0,
      'no console or HTTP errors',
      view.errors.join(' | ').slice(0, 200),
    );
    await view.close();
  }

  // 2. Mobile, Indonesian.
  {
    const view = await openPage(browser, app, {
      width: 375,
      height: 812,
      mobile: true,
      scheme: 'dark',
    });
    const { page } = view;
    await page.waitForSelector('button[lang="id"]');
    await page.click('button[lang="id"]');
    await page.waitForFunction(() => document.documentElement.lang === 'id');
    results.check(true, 'language switch sets <html lang="id">');
    results.check(
      (await page.title()).startsWith('Invoice · Demo Invoice'),
      'tab title is localized',
      await page.title(),
    );
    results.check(
      (await page.$eval('footer a', (a) => a.getAttribute('href'))) === '../id/',
      'back-to-portfolio link follows the language (../id/)',
    );
    for (const hash of ['#/invoices', '#/invoices/new', '#/settings', '#/invoices/demo-2/print']) {
      await page.goto(`${app}${hash}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('h1');
      results.check(
        (await horizontalOverflow(page)) <= 0,
        `no horizontal page scroll on mobile ${hash}`,
      );
    }
    await page.goto(`${app}#/invoices/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#field-customer');
    await screenshot(page, 'vue-editor-mobile-dark-id');
    results.check(
      view.errors.length === 0,
      'no errors on mobile',
      view.errors.join(' | ').slice(0, 200),
    );
    await view.close();
  }
}
