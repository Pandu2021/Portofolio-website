/**
 * @file assemble-site.mjs
 * Combines the build output of every app into one static site folder:
 *
 *   apps/portfolio/out          → _site/
 *   apps/react-storefront/dist  → _site/react/
 *   apps/angular-dashboard/dist → _site/angular/
 *   apps/vue-invoice/dist       → _site/vue/
 *
 * Run after `pnpm build`:  node scripts/assemble-site.mjs
 *
 * Safety checks (the script fails loudly instead of deploying a broken site):
 *  - every app's build folder exists and contains an index.html;
 *  - no app overwrites another app's files;
 *  - every non-planned app in the Tech Lab registry (showcase.json) is published;
 *  - `.nojekyll` is written so GitHub Pages never runs Jekyll on the output.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE_APPS, SITE_DIR } from './site-apps.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Checks that every live / in-progress app of the Tech Lab is published, so
 * no "Live demo" link on the portfolio can point to a missing folder.
 *
 * @param {readonly {to: string}[]} apps  Apps being published.
 * @param {{ id: string, path: string, status: string }[]} showcase  Registry entries.
 * @throws {Error} When a showcase app has no matching published folder.
 */
export function assertShowcaseCovered(apps, showcase) {
  const published = new Set(apps.map((app) => (app.to ? `${app.to}/` : '')));
  const missing = showcase.filter(
    (entry) => entry.status !== 'planned' && !published.has(entry.path),
  );
  if (missing.length > 0) {
    throw new Error(
      `Showcase apps without a published folder: ${missing.map((m) => `${m.id} (${m.path})`).join(', ')}. ` +
        'Add them to scripts/site-apps.mjs.',
    );
  }
}

/**
 * Builds the combined site.
 *
 * @param {object} [options]
 * @param {string} [options.root]   Repository root.
 * @param {string} [options.outDir] Output folder (default `_site`).
 * @param {readonly {id: string, from: string, to: string}[]} [options.apps] Apps to publish.
 * @returns {{ outDir: string, apps: string[] }} Summary of what was written.
 */
export function assembleSite({ root = ROOT, outDir = SITE_DIR, apps = SITE_APPS } = {}) {
  const target = resolve(root, outDir);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  // Root app first, so sub-path apps can be checked for collisions afterwards.
  const ordered = [...apps].sort((a, b) => a.to.length - b.to.length);
  for (const app of ordered) {
    const source = resolve(root, app.from);
    if (!existsSync(join(source, 'index.html'))) {
      throw new Error(
        `[assemble] ${app.id}: ${app.from}/index.html not found. Run "pnpm build" first.`,
      );
    }
    const destination = join(target, app.to);
    if (app.to && existsSync(destination)) {
      throw new Error(
        `[assemble] ${app.id}: "${app.to}/" already exists in ${outDir} (path collision).`,
      );
    }
    cpSync(source, destination, { recursive: true });
  }

  // GitHub Pages: skip Jekyll processing (keeps folders such as _next/ intact).
  writeFileSync(join(target, '.nojekyll'), '');

  return { outDir: target, apps: ordered.map((app) => `${app.id} → /${app.to}`) };
}

/** CLI entry point. */
function main() {
  const showcase = JSON.parse(
    readFileSync(join(ROOT, 'packages/content/src/data/showcase.json'), 'utf8'),
  );
  assertShowcaseCovered(SITE_APPS, showcase);
  const { outDir, apps } = assembleSite();
  console.log(`[assemble] Site written to ${outDir}`);
  for (const line of apps) console.log(`[assemble]   ${line}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
