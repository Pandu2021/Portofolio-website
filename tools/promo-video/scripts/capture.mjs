/**
 * @file capture.mjs
 * `pnpm capture` — clean screenshots of the PUBLIC portfolio for the video:
 * no browser toolbar, no localhost, no computer user name; only the public site
 * and its fictional demo data (the confidential client project is never shown).
 *
 *   SITE_URL=https://…/ pnpm capture   (default: the live GitHub Pages site)
 *
 * Images (device scale 2, reduced motion = final states) go to
 * public/generated/captures/.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../../scripts/e2e/browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'generated', 'captures');
const SITE = (process.env.SITE_URL ?? 'https://pandu2021.github.io/Portofolio-website/').replace(
  /\/?$/,
  '/',
);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

mkdirSync(OUT, { recursive: true });
const browser = await launchBrowser();

/** New isolated page (fresh storage) with the given viewport and theme. */
async function newPage({ width = 1280, height = 860, scheme = 'light', mobile = false } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 2,
    isMobile: mobile,
    hasTouch: mobile,
  });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scheme },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  return { page, close: () => context.close() };
}

/** Waits for web fonts, then a short settle. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(400);
}

/** Hides fixed UI that would overlap a section screenshot (CSSOM — CSP-safe). */
async function hideFloating(page, selectors) {
  await page.evaluate((list) => {
    for (const selector of list) {
      document
        .querySelectorAll(selector)
        .forEach((el) => el.style.setProperty('display', 'none', 'important'));
    }
  }, selectors);
}

const shots = [];
async function viewport(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`), captureBeyondViewport: false });
  shots.push(name);
}
async function element(page, selector, name) {
  const handle = await page.waitForSelector(selector);
  await handle.screenshot({ path: join(OUT, `${name}.png`) });
  shots.push(name);
}

try {
  // 1. Portfolio hero + highlights (light, desktop).
  {
    const { page, close } = await newPage({ height: 900 });
    await page.goto(SITE, { waitUntil: 'networkidle0' });
    await settle(page);
    await viewport(page, 'hero');
    // 2. Tech Lab and Skills as sections (header and ↑ button hidden).
    await hideFloating(page, ['.site-header', '.back-to-top']);
    await element(page, '#tech-lab .lab-grid', 'techlab');
    await element(page, '#skills', 'skills');
    await close();
  }
  // 3. React storefront.
  {
    const { page, close } = await newPage();
    await page.goto(`${SITE}react/`, { waitUntil: 'networkidle0' });
    await settle(page);
    await viewport(page, 'react');
    await close();
  }
  // 4. Angular dashboard after the demo sign-in (credentials are shown on the public page).
  {
    const { page, close } = await newPage();
    await page.goto(`${SITE}angular/#/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#login-username');
    await page.type('#login-username', 'demo');
    await page.type('#login-password', 'portfolio-demo');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash.startsWith('#/overview'), { timeout: 15_000 });
    await page.waitForSelector('svg');
    await settle(page);
    await viewport(page, 'angular');
    await close();
  }
  // 5. Vue invoice editor with live totals.
  {
    const { page, close } = await newPage();
    await page.goto(`${SITE}vue/#/invoices/demo-2`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="grand-total"]');
    await settle(page);
    await viewport(page, 'vue');
    await close();
  }
  // 6. One dark-theme view: the portfolio on a phone.
  {
    const { page, close } = await newPage({
      width: 390,
      height: 844,
      scheme: 'dark',
      mobile: true,
    });
    await page.goto(SITE, { waitUntil: 'networkidle0' });
    await settle(page);
    await viewport(page, 'dark-mobile');
    await close();
  }
} finally {
  await browser.close();
}
console.log(`[capture] ${shots.length} images from ${SITE} → ${OUT}\n  ${shots.join(', ')}`);
