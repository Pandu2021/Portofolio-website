/**
 * @file run.mjs
 * Browser E2E test runner (puppeteer-core + an installed Chrome/Edge).
 *
 *   pnpm e2e            build output: serves _site/ like GitHub Pages and tests it
 *   pnpm e2e:live       the deployed site (read-only: state stays in the test browser)
 *   pnpm e2e:dev        a running `pnpm dev` gateway on http://localhost:3000/
 *
 * Options:
 *   --suite=portfolio,react,angular,vue,layout   run only some suites
 *   E2E_SCREENSHOTS=<folder>                  save screenshots there
 *   BROWSER_PATH=<path>                       use a specific browser
 *
 * Exit code 1 when any check fails.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './browser.mjs';
import { Results } from './harness.mjs';
import { startSiteServer } from '../lib/site-server.mjs';
import { DEV_GATEWAY_PORT, PAGES_BASE_PATH, SITE_DIR } from '../site-apps.mjs';
import * as angular from './suites/angular.mjs';
import * as devGateway from './suites/dev-gateway.mjs';
import * as layout from './suites/layout.mjs';
import * as portfolio from './suites/portfolio.mjs';
import * as react from './suites/react.mjs';
import * as vue from './suites/vue.mjs';

const LIVE_URL = `https://pandu2021.github.io${PAGES_BASE_PATH}/`;
const SITE_SUITES = { portfolio, react, angular, vue, layout };

const args = process.argv.slice(2);
const mode = args.includes('--live') ? 'live' : args.includes('--dev') ? 'dev' : 'local';
const only = args
  .find((arg) => arg.startsWith('--suite='))
  ?.slice('--suite='.length)
  .split(',');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..', SITE_DIR);
const server = mode === 'local' ? await startSiteServer({ root, basePath: PAGES_BASE_PATH }) : null;
const base =
  mode === 'live'
    ? LIVE_URL
    : mode === 'dev'
      ? `http://localhost:${DEV_GATEWAY_PORT}/`
      : `${server?.origin}${PAGES_BASE_PATH}/`;

const suites =
  mode === 'dev'
    ? { 'dev-gateway': devGateway }
    : Object.fromEntries(
        Object.entries(SITE_SUITES).filter(([name]) => !only || only.includes(name)),
      );

console.log(`[e2e] mode=${mode}  base=${base}`);
const results = new Results();
const browser = await launchBrowser();
try {
  for (const [name, suite] of Object.entries(suites)) {
    console.log(`\n[e2e] ${name}`);
    results.suite = name;
    try {
      await suite.run({ browser, results, base });
    } catch (error) {
      // Message plus the first stack frame inside our suites, to find the failing step.
      const where =
        error instanceof Error
          ? ((error.stack ?? '')
              .split('\n')
              .find((line) => line.includes('scripts') && line.includes('e2e')) ?? '')
          : '';
      results.check(
        false,
        `${name} suite crashed`,
        `${error instanceof Error ? error.message : String(error)} ${where.trim()}`,
      );
    }
  }
} finally {
  await browser.close();
  await server?.close();
}

const failed = results.failures;
console.log(
  `\n[e2e] ${results.items.length - failed.length}/${results.items.length} checks passed`,
);
for (const failure of failed)
  console.log(`[e2e] FAIL ${failure.suite}: ${failure.name} ${failure.detail}`);
process.exit(failed.length ? 1 : 0);
