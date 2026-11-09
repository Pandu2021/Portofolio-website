/**
 * @file angular.mjs
 * E2E checks for the Angular dashboard: guard + demo sign-in, orders (filter,
 * paging, live RxJS feed), order detail, settings validation, overview KPIs and
 * charts, sign-out, language and mobile layout. Session data stays inside an
 * isolated browser context.
 */
import {
  clickText,
  fillInput,
  horizontalOverflow,
  openPage,
  screenshot,
  sleep,
  waitForHeading,
} from '../harness.mjs';

/**
 * @param {{ browser: import('puppeteer-core').Browser, results: import('../harness.mjs').Results, base: string }} context
 */
export async function run({ browser, results, base }) {
  const app = `${base}angular/`;

  // 1. Full desktop flow.
  {
    const view = await openPage(browser, `${app}#/orders`);
    const { page } = view;
    results.check(
      page.url().includes('#/login?returnUrl=%2Forders'),
      'guard redirects to login with returnUrl',
    );
    results.check(
      await page.evaluate(() => document.documentElement.classList.contains('js')),
      'theme boot script ran',
    );

    await clickText(page, 'button', 'Sign in');
    await page.waitForSelector('#login-username-error');
    results.check(true, 'empty submit shows required-field errors');
    await page.type('#login-username', 'demo');
    await page.type('#login-password', 'wrong');
    await clickText(page, 'button', 'Sign in');
    await page.waitForSelector('[role="alert"]');
    results.check(true, 'wrong password shows an alert');
    await page.type('#login-password', 'portfolio-demo');
    await clickText(page, 'button', 'Sign in');
    await waitForHeading(page, 'Orders');
    results.check(true, 'demo sign-in returns to the requested page');

    results.check(
      (await page.$$('.table-wrap tbody tr')).length === 10,
      'orders table shows 10 rows',
    );
    await page.select('#orders-status', 'delivered');
    await sleep(200);
    const statuses = await page.$$eval('.table-wrap tbody .status', (els) => [
      ...new Set(els.map((el) => el.textContent?.trim())),
    ]);
    results.check(
      statuses.length === 1 && statuses[0] === 'Delivered',
      'status filter works',
      statuses.join(','),
    );
    await page.select('#orders-status', 'all');
    await clickText(page, 'button', 'Next');
    await sleep(150);
    results.check(
      (await page.$eval('.pager__info', (el) => el.textContent ?? '')).includes('Page 2'),
      'pagination moves to page 2',
    );
    await clickText(page, 'button', '← Previous');

    await clickText(page, 'button', 'Start live orders');
    await page.waitForFunction(() => document.querySelector('tbody tr.is-new'), {
      timeout: 10_000,
    });
    // The announcer clears and then sets its text 60 ms later.
    await page.waitForFunction(
      () => document.querySelector('[role="status"][aria-live="polite"]')?.textContent?.trim(),
      { timeout: 2_000 },
    );
    const announced = await page.$eval(
      '[role="status"][aria-live="polite"]',
      (el) => el.textContent?.trim() ?? '',
    );
    results.check(
      /^New order ORD-\d+ — \S/.test(announced) && !announced.includes('..'),
      'live order is announced',
      announced,
    );
    await clickText(page, 'button', 'Pause live orders');

    await page.click('.table-wrap tbody tr th a');
    await waitForHeading(page, 'Order ORD-');
    results.check(
      (await page.$$('.detail-grid table tbody tr')).length > 0,
      'order detail lists items',
    );

    await page.click('a[href="#/settings"]');
    await waitForHeading(page, 'Pricing settings');
    await fillInput(page, '#pricing-taxPercent', '99');
    await clickText(page, 'button', 'Save settings');
    await sleep(250);
    results.check(
      (await page.evaluate(() => document.activeElement?.id)) === 'pricing-taxPercent',
      'invalid save moves focus to the first invalid field',
    );
    await fillInput(page, '#pricing-taxPercent', '10');
    await clickText(page, 'button', 'Save settings');
    await page.waitForFunction(() => document.body.textContent?.includes('Settings saved.'));
    results.check(true, 'valid settings are saved');

    await page.click('a[href="#/overview"]');
    await waitForHeading(page, 'Overview');
    results.check((await page.$$('.kpi')).length === 4, 'overview shows 4 KPIs');
    results.check(
      (await page.$$('svg[role="img"]')).length === 2,
      'overview shows 2 labelled charts',
    );
    await screenshot(page, 'angular-overview', true);

    const csp = await view.csp();
    results.check(csp.length === 0, 'no CSP violations during the flow', csp.join(' | '));
    results.check(
      view.errors.length === 0,
      'no console or HTTP errors',
      view.errors.join(' | ').slice(0, 200),
    );

    await clickText(page, 'button', 'Sign out');
    await waitForHeading(page, 'Sign in');
    results.check(true, 'sign out returns to the login page');
    await view.close();
  }

  // 2. Mobile, dark theme, Indonesian.
  {
    const view = await openPage(browser, `${app}#/login`, {
      width: 375,
      height: 812,
      mobile: true,
      scheme: 'dark',
    });
    const { page } = view;
    await page.type('#login-username', 'demo');
    await page.type('#login-password', 'portfolio-demo');
    await clickText(page, 'button', 'Sign in');
    await waitForHeading(page, 'Overview');
    await clickText(page, 'button.lang-switch__button', 'ID');
    await waitForHeading(page, 'Ringkasan');
    results.check(
      (await page.evaluate(() => document.documentElement.lang)) === 'id-ID',
      'language switch sets <html lang>',
    );
    results.check(
      (await page.title()).startsWith('Ringkasan'),
      'tab title is localized',
      await page.title(),
    );
    const back = await page.$eval('footer a.link-strong', (a) => a.getAttribute('href'));
    results.check(back === '../id/', 'back-to-portfolio link follows the language', back ?? '');
    for (const hash of ['#/overview', '#/orders', '#/settings']) {
      await page.goto(app + hash, { waitUntil: 'networkidle0' });
      results.check(
        (await horizontalOverflow(page)) <= 0,
        `no horizontal page scroll on mobile ${hash}`,
      );
    }
    await screenshot(page, 'angular-settings-mobile-dark', true);
    results.check(
      view.errors.length === 0,
      'no errors on mobile',
      view.errors.join(' | ').slice(0, 200),
    );
    await view.close();
  }
}
