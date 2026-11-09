/**
 * @file check-links.mjs
 * Link checker for the assembled `_site/` (run `pnpm build:site` first).
 *
 *  - Internal links/assets (href, src): the file must exist; same-page anchors
 *    (`#skills`) must match an element id. Hash routes of the SPAs (`#/cart`)
 *    are app routes, not files, and are skipped.
 *  - External links: one read-only GET per unique URL (redirects followed).
 *    Sites that block automated requests (e.g. LinkedIn answers 999, some
 *    answer 403/429) are reported as "blocked — check manually", not as errors.
 *
 * Usage: pnpm links            Exit code 1 only for broken internal links or
 *                              external 404/410 responses.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES_BASE_PATH, SITE_DIR } from './site-apps.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', SITE_DIR);
const SITE_ORIGIN = 'https://pandu2021.github.io';
const BLOCKED_STATUSES = new Set([401, 403, 429, 999]);
const BROKEN_STATUSES = new Set([404, 410]);

/** Every file below `dir` with one of the given extensions. */
function listFiles(dir, extensions) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [path] : [];
  });
}

/** Maps a site URL path (`/Portofolio-website/react/`) to a file in _site/, or null. */
function fileForPath(urlPath) {
  if (!urlPath.startsWith(`${PAGES_BASE_PATH}/`)) return null;
  const candidate = join(ROOT, decodeURIComponent(urlPath.slice(PAGES_BASE_PATH.length)));
  if (existsSync(candidate) && statSync(candidate).isDirectory())
    return join(candidate, 'index.html');
  return candidate;
}

const pages = listFiles(ROOT, ['.html']).filter(
  (file) => !file.includes(`${join(ROOT, '_not-found')}`),
);
/** @type {{ page: string, url: string, problem: string }[]} */
const broken = [];
/** @type {Map<string, Set<string>>} external URL → pages using it */
const external = new Map();

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const pagePath = `${PAGES_BASE_PATH}/${relative(ROOT, page)
    .replace(/\\/g, '/')
    .replace(/index\.html$/, '')}`;
  const pageUrl = new URL(pagePath, SITE_ORIGIN);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const label = relative(ROOT, page).replace(/\\/g, '/');

  const links = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]),
    // JSON-LD and other absolute URLs written in the page.
    ...[...html.matchAll(/"(?:url|sameAs)":"(https:\/\/[^"]+)"/g)].map((match) => match[1]),
  ];
  for (const raw of links) {
    const href = raw.replace(/&amp;/g, '&');
    if (/^(mailto|tel|data|javascript):/i.test(href)) continue;
    if (href.startsWith('#/')) continue; // SPA hash route
    if (href.startsWith('#')) {
      if (href.length > 1 && !ids.has(href.slice(1)))
        broken.push({ page: label, url: href, problem: 'missing anchor' });
      continue;
    }
    const url = new URL(href, pageUrl);
    if (url.origin === SITE_ORIGIN && url.pathname.startsWith(PAGES_BASE_PATH)) {
      const file = fileForPath(url.pathname);
      if (!file || !existsSync(file))
        broken.push({ page: label, url: url.pathname, problem: 'file not found' });
      continue;
    }
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      if (!external.has(url.href)) external.set(url.href, new Set());
      external.get(url.href)?.add(label);
    }
  }
}

// The SPA bundles contain their own external links (e.g. "Source code").
for (const bundle of listFiles(ROOT, ['.js'])) {
  if (bundle.includes(`${join(ROOT, '_next')}`)) continue;
  const text = readFileSync(bundle, 'utf8');
  for (const match of text.matchAll(/https:\/\/github\.com\/Pandu2021\/[\w./-]+/g)) {
    if (!external.has(match[0])) external.set(match[0], new Set());
    external.get(match[0])?.add(relative(ROOT, bundle).replace(/\\/g, '/'));
  }
}

/** Fetches one external URL (read-only) and classifies the result. */
async function probe(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; portfolio-link-check/1.0)' },
    });
    await response.body?.cancel();
    if (response.ok) return { url, status: response.status, state: 'ok' };
    if (BLOCKED_STATUSES.has(response.status))
      return { url, status: response.status, state: 'blocked' };
    return {
      url,
      status: response.status,
      state: BROKEN_STATUSES.has(response.status) ? 'broken' : 'warning',
    };
  } catch (error) {
    return {
      url,
      status: 0,
      state: 'warning',
      note: error instanceof Error ? error.message : String(error),
    };
  }
}

const urls = [...external.keys()].sort();
const results = [];
for (let i = 0; i < urls.length; i += 4) {
  results.push(...(await Promise.all(urls.slice(i, i + 4).map(probe))));
}

console.log(`[links] ${pages.length} pages, ${urls.length} unique external URLs\n`);
for (const result of results) {
  const tag = { ok: 'OK     ', blocked: 'BLOCKED', warning: 'WARN   ', broken: 'BROKEN ' }[
    result.state
  ];
  console.log(
    `[links] ${tag} ${String(result.status).padStart(3)}  ${result.url}${result.note ? `  (${result.note})` : ''}`,
  );
}
for (const item of broken)
  console.log(`[links] BROKEN internal  ${item.page} → ${item.url} (${item.problem})`);

const brokenExternal = results.filter((result) => result.state === 'broken');
const blocked = results.filter((result) => result.state === 'blocked');
console.log(
  `\n[links] internal broken: ${broken.length} · external ok: ${results.filter((r) => r.state === 'ok').length}` +
    ` · blocked (check manually): ${blocked.length} · warnings: ${results.filter((r) => r.state === 'warning').length}` +
    ` · broken: ${brokenExternal.length}`,
);
process.exit(broken.length || brokenExternal.length ? 1 : 0);
