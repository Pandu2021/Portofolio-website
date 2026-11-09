/**
 * @file harness.mjs
 * Tiny E2E harness: named checks with PASS/FAIL output, isolated pages that
 * record console errors, failed requests and Content-Security-Policy
 * violations, plus a few interaction helpers.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Results collector shared by all suites of one run. */
export class Results {
  /** @type {{ suite: string, name: string, ok: boolean, detail: string }[]} */
  items = [];
  suite = '';

  /**
   * Records one check and prints it.
   * @param {boolean} ok
   * @param {string} name
   * @param {string} [detail]
   */
  check(ok, name, detail = '') {
    this.items.push({ suite: this.suite, name, ok, detail });
    console.log(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  }

  get failures() {
    return this.items.filter((item) => !item.ok);
  }
}

/**
 * @typedef {object} PageOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {boolean} [mobile]
 * @property {'light'|'dark'} [scheme]
 * @property {boolean} [reducedMotion] Emulate prefers-reduced-motion (turns off smooth scrolling).
 */

/**
 * Opens a URL in a fresh browser context (own storage) and records problems.
 * @param {import('puppeteer-core').Browser} browser
 * @param {string} url
 * @param {PageOptions} [options]
 */
export async function openPage(
  browser,
  url,
  { width = 1280, height = 900, mobile = false, scheme = 'light', reducedMotion = false } = {},
) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  /** @type {string[]} */
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  await page.evaluateOnNewDocument(() => {
    // @ts-expect-error test-only global
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (event) =>
      // @ts-expect-error test-only global
      window.__csp.push(`${event.violatedDirective} ${event.blockedURI}`),
    );
  });
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scheme },
    { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
  ]);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });
  return {
    page,
    errors,
    /** CSP violations seen so far. @returns {Promise<string[]>} */
    csp: () => page.evaluate(() => /** @type {any} */ (window).__csp),
    close: () => context.close(),
  };
}

/**
 * Clicks the first element matching `selector` whose text starts with `text`.
 * @param {import('puppeteer-core').Page} page
 */
export async function clickText(page, selector, text) {
  const handle = await page.evaluateHandle(
    (sel, value) =>
      [...document.querySelectorAll(sel)].find((el) => el.textContent?.trim().startsWith(value)) ??
      null,
    selector,
    text,
  );
  const element = handle.asElement();
  if (!element) throw new Error(`No ${selector} with text "${text}"`);
  await /** @type {import('puppeteer-core').ElementHandle<Element>} */ (element).click();
}

/**
 * Replaces the value of an input like a user would (select all, delete, type).
 * Triple-click is not reliable for selecting the text of number inputs.
 * @param {import('puppeteer-core').Page} page
 * @param {string} selector
 * @param {string} value
 */
export async function fillInput(page, selector, value) {
  await page.click(selector);
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.down(modifier);
  await page.keyboard.press('KeyA');
  await page.keyboard.up(modifier);
  await page.keyboard.press('Backspace');
  await page.type(selector, value);
}

/**
 * Waits until the page's H1 contains `text`.
 * @param {import('puppeteer-core').Page} page
 */
export function waitForHeading(page, text, timeout = 15_000) {
  return page.waitForFunction(
    (value) => document.querySelector('h1')?.textContent?.includes(value),
    { timeout },
    text,
  );
}

/** Horizontal overflow of the page in pixels (0 = no sideways scrolling). */
export function horizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/**
 * Saves a screenshot when E2E_SCREENSHOTS is set (folder path).
 * @param {import('puppeteer-core').Page} page
 * @param {string} name
 */
export async function screenshot(page, name, fullPage = false) {
  const dir = process.env.E2E_SCREENSHOTS;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage });
}

/** Promise-based delay. */
export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
