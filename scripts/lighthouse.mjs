/**
 * @file lighthouse.mjs
 * Lighthouse audit of the assembled `_site/` (served like GitHub Pages) for
 * every app, on mobile and desktop.
 *
 *   pnpm lighthouse                 audit _site/ (run `pnpm build:site` first)
 *   pnpm lighthouse -- --live       audit the deployed site instead
 *   pnpm lighthouse -- --runs=3     run every page N times and report the MEDIAN
 *                                   (a single run on a busy laptop can swing by
 *                                   20+ points; the median is far more stable)
 *   LH_MIN=90 (default)             minimum score per category; exit 1 below it
 *
 * Reports (HTML + summary.json) are written to `.lighthouseci/` (git-ignored).
 * Uses the same installed Chrome/Edge as the E2E tests (scripts/e2e/browser.mjs).
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { launchBrowser } from './e2e/browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { PAGES_BASE_PATH, SITE_DIR } from './site-apps.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = join(ROOT, '.lighthouseci');
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const PAGES = [
  ['portfolio (EN)', ''],
  ['portfolio (ID)', 'id/'],
  ['react', 'react/'],
  ['angular', 'angular/'],
  ['vue', 'vue/'],
];
const MIN = Number(process.env.LH_MIN ?? 90);
const live = process.argv.includes('--live');
const runsArg = process.argv.find((arg) => arg.startsWith('--runs='));
const RUNS = Math.max(1, Number.parseInt(runsArg?.slice('--runs='.length) ?? '1', 10) || 1);

/** Middle value of a list (lower middle for even lengths). */
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)];

const server = live
  ? null
  : await startSiteServer({ root: join(ROOT, SITE_DIR), basePath: PAGES_BASE_PATH });
const base = live
  ? `https://pandu2021.github.io${PAGES_BASE_PATH}/`
  : `${server?.origin}${PAGES_BASE_PATH}/`;
const browser = await launchBrowser();
const port = Number(new URL(browser.wsEndpoint()).port);
mkdirSync(REPORT_DIR, { recursive: true });

/** @type {{ page: string, device: string, scores: Record<string, number>, perfRuns: number[], failed: string[] }[]} */
const rows = [];
try {
  for (const [name, path] of PAGES) {
    for (const device of ['mobile', 'desktop']) {
      /** @type {{ lhr: any, report: string | string[], scores: Record<string, number> }[]} */
      const runs = [];
      for (let run = 0; run < RUNS; run++) {
        const result = await lighthouse(
          base + path,
          { port, output: 'html', logLevel: 'error', onlyCategories: CATEGORIES },
          device === 'desktop' ? desktopConfig : undefined,
        );
        if (!result) throw new Error(`Lighthouse returned no result for ${base + path}`);
        const runScores = Object.fromEntries(
          CATEGORIES.map((category) => [
            category,
            Math.round((result.lhr.categories[category]?.score ?? 0) * 100),
          ]),
        );
        runs.push({ lhr: result.lhr, report: result.report, scores: runScores });
      }
      // Median per category; the saved report is the run whose performance equals the median.
      const scores = Object.fromEntries(
        CATEGORIES.map((category) => [category, median(runs.map((r) => r.scores[category]))]),
      );
      const { lhr, report } =
        runs.find((r) => r.scores.performance === scores.performance) ?? runs[0];
      // Audits that cost points, for the report (score < 0.9 and weighted).
      const failed = Object.values(lhr.categories)
        .flatMap((category) =>
          category.auditRefs.filter((ref) => ref.weight > 0).map((ref) => lhr.audits[ref.id]),
        )
        .filter((audit) => audit && audit.score !== null && audit.score < 0.9)
        .map((audit) => audit.id);
      const file = `${name.replace(/\W+/g, '-').replace(/-$/, '')}-${device}.html`;
      writeFileSync(join(REPORT_DIR, file), Array.isArray(report) ? report[0] : report);
      const perfRuns = runs.map((r) => r.scores.performance);
      rows.push({ page: name, device, scores, perfRuns, failed: [...new Set(failed)] });
      console.log(
        `[lighthouse] ${name.padEnd(15)} ${device.padEnd(7)} ` +
          CATEGORIES.map((c) => `${c.slice(0, 4)} ${String(scores[c]).padStart(3)}`).join('  ') +
          (RUNS > 1 ? `   (perf runs: ${perfRuns.join(', ')})` : ''),
      );
    }
  }
} finally {
  await browser.close();
  await server?.close();
}

writeFileSync(
  join(REPORT_DIR, 'summary.json'),
  JSON.stringify({ base, min: MIN, runs: RUNS, rows }, null, 2),
);

// In GitHub Actions, also show the scores as a table on the run's summary page.
if (process.env.GITHUB_STEP_SUMMARY) {
  const header = `| Page | Device | ${CATEGORIES.join(' | ')} |\n|---|---|${CATEGORIES.map(() => '---:').join('|')}|\n`;
  const lines = rows
    .map(
      (row) =>
        `| ${row.page} | ${row.device} | ${CATEGORIES.map((c) => row.scores[c]).join(' | ')} |`,
    )
    .join('\n');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Lighthouse (minimum ${MIN}${RUNS > 1 ? `, median of ${RUNS} runs` : ''})\n\n${header}${lines}\n`,
  );
}
const below = rows.filter((row) => CATEGORIES.some((c) => row.scores[c] < MIN));
for (const row of below) {
  console.log(
    `[lighthouse] below ${MIN}: ${row.page} ${row.device} → audits: ${row.failed.join(', ')}`,
  );
}
console.log(`[lighthouse] reports: ${REPORT_DIR}`);
process.exit(below.length ? 1 : 0);
