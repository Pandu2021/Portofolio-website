/**
 * @file pagespeed.mjs
 * Lighthouse scores of the LIVE site measured by Google PageSpeed Insights
 * (Lighthouse running on Google's servers: stable hardware, unlike a busy
 * development laptop where CPU load distorts the Performance score).
 *
 *   pnpm pagespeed                  mobile + desktop for every app
 *   PAGESPEED_API_KEY=…             optional, for higher rate limits (never commit it)
 *
 * Read-only: only public URLs of the deployed site are sent to the API.
 */
import { PAGES_BASE_PATH } from './site-apps.mjs';

const LIVE = `https://pandu2021.github.io${PAGES_BASE_PATH}/`;
const PAGES = [
  ['portfolio (EN)', ''],
  ['portfolio (ID)', 'id/'],
  ['react', 'react/'],
  ['angular', 'angular/'],
  ['vue', 'vue/'],
];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const MIN = Number(process.env.LH_MIN ?? 90);

/**
 * Runs one PageSpeed Insights analysis.
 * @param {string} url
 * @param {'mobile'|'desktop'} strategy
 * @returns {Promise<Record<string, number>>} scores 0–100 per category
 */
async function analyze(url, strategy) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', url);
  api.searchParams.set('strategy', strategy);
  for (const category of CATEGORIES)
    api.searchParams.append('category', category.toUpperCase().replace('-', '_'));
  if (process.env.PAGESPEED_API_KEY) api.searchParams.set('key', process.env.PAGESPEED_API_KEY);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(api, { signal: AbortSignal.timeout(120_000) });
    if (response.ok) {
      const body = await response.json();
      const categories = body.lighthouseResult?.categories ?? {};
      return Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          Math.round((categories[category]?.score ?? 0) * 100),
        ]),
      );
    }
    if (attempt === 3) throw new Error(`PageSpeed API ${response.status} for ${url} (${strategy})`);
    await new Promise((done) => setTimeout(done, 5_000 * attempt));
  }
  throw new Error('unreachable');
}

let below = 0;
for (const [name, path] of PAGES) {
  for (const strategy of ['mobile', 'desktop']) {
    const scores = await analyze(LIVE + path, strategy);
    if (CATEGORIES.some((category) => scores[category] < MIN)) below++;
    console.log(
      `[pagespeed] ${name.padEnd(15)} ${strategy.padEnd(7)} ` +
        CATEGORIES.map((c) => `${c.slice(0, 4)} ${String(scores[c]).padStart(3)}`).join('  '),
    );
  }
}
console.log(
  below ? `[pagespeed] ${below} result(s) below ${MIN}` : `[pagespeed] all scores ≥ ${MIN}`,
);
process.exit(below ? 1 : 0);
