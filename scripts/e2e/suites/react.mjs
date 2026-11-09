/**
 * @file react.mjs
 * E2E checks for the React storefront: catalog, cart, promo code, checkout
 * validation and confirmation, persistence, language and mobile layout.
 * Everything happens in an isolated browser context (no server state).
 */
import { clickText, horizontalOverflow, openPage, screenshot, sleep } from '../harness.mjs';

/**
 * @param {{ browser: import('puppeteer-core').Browser, results: import('../harness.mjs').Results, base: string }} context
 */
export async function run({ browser, results, base }) {
  const app = `${base}react/`;

  // 1. Desktop shopping flow.
  {
    const view = await openPage(browser, app);
    const { page } = view;
    results.check((await page.$$('article')).length === 12, 'catalog shows 12 products');
    results.check(
      await page.evaluate(() => document.documentElement.classList.contains('js')),
      'theme boot script ran before the app',
    );
    await page.click('button[aria-label="Add Cappuccino to cart"]');
    await page.click('button[aria-label="Add Butter Croissant to cart"]');
    const cartLabel = await page.$eval('a.nav-link--cart', (a) => a.getAttribute('aria-label'));
    results.check(cartLabel === 'Cart, 2 items', 'cart count updates', cartLabel ?? '');

    await page.click('a.nav-link--cart');
    await page.waitForSelector('.cart-line');
    await page.type('input[maxlength="20"]', 'hemat10');
    await clickText(page, 'button', 'Apply');
    await page.waitForFunction(() => document.body.textContent?.includes('Code HEMAT10 applied.'));
    results.check(true, 'promo code HEMAT10 is applied');

    await page.click('a[href="#/checkout"]');
    await page.waitForSelector('form.checkout-form');
    await clickText(page, 'button', 'Place demo order');
    await page.waitForSelector('.error-summary');
    await sleep(300);
    results.check(
      await page.evaluate(() => document.activeElement?.classList.contains('error-summary')),
      'error summary receives focus after an invalid submit',
    );
    results.check(
      await page.evaluate(() => {
        const header = document.querySelector('.header')?.getBoundingClientRect();
        const summary = document.querySelector('.error-summary')?.getBoundingClientRect();
        return Boolean(header && summary && summary.top >= header.bottom);
      }),
      'focused error summary is not hidden behind the sticky header',
    );
    await page.type('#checkout-name', 'Budi Santoso');
    await page.type('#checkout-email', 'budi@example.com');
    await page.type('#checkout-address', 'Jl. Contoh No. 1, Jakarta');
    await clickText(page, 'button', 'Place demo order');
    await page.waitForFunction(() =>
      document.querySelector('h1')?.textContent?.includes('Order confirmed'),
    );
    results.check(true, 'valid checkout shows the demo confirmation');

    const csp = await view.csp();
    results.check(csp.length === 0, 'no CSP violations during the flow', csp.join(' | '));
    results.check(
      view.errors.length === 0,
      'no console or HTTP errors',
      view.errors.join(' | ').slice(0, 200),
    );

    await page.goto(`${app}#/`, { waitUntil: 'networkidle0' });
    await page.click('button[aria-label="Add Matcha Latte to cart"]');
    await page.reload({ waitUntil: 'networkidle0' });
    const afterReload = await page.$eval('a.nav-link--cart', (a) => a.getAttribute('aria-label'));
    results.check(afterReload === 'Cart, 1 item', 'cart survives a reload', afterReload ?? '');
    await view.close();
  }

  // 2. Mobile, dark theme, Indonesian.
  {
    const view = await openPage(browser, `${app}#/product/special-fried-rice`, {
      width: 375,
      height: 812,
      mobile: true,
      scheme: 'dark',
    });
    const { page } = view;
    results.check(
      (await horizontalOverflow(page)) <= 0,
      'no horizontal scroll on the mobile product page',
    );
    await clickText(page, 'button.lang-switch__button', 'ID');
    results.check(
      (await page.evaluate(() => document.documentElement.lang)) === 'id-ID',
      'language switch sets <html lang>',
    );
    await screenshot(page, 'react-product-mobile-dark', true);
    await page.goto(`${app}#/`, { waitUntil: 'networkidle0' });
    results.check(
      (await horizontalOverflow(page)) <= 0,
      'no horizontal scroll on the mobile catalog',
    );
    const back = await page.$eval('footer a.link-strong', (a) => a.getAttribute('href'));
    results.check(back === '../id/', 'back-to-portfolio link follows the language', back ?? '');
    results.check(
      view.errors.length === 0,
      'no errors on mobile',
      view.errors.join(' | ').slice(0, 200),
    );
    await view.close();
  }
}
