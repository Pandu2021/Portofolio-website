/**
 * @file preview-site.mjs
 * Serves the assembled `_site/` locally exactly like GitHub Pages will:
 *
 *   http://localhost:4173/                            → redirects to /Portofolio-website/
 *   http://localhost:4173/Portofolio-website/         → portfolio (EN)
 *   http://localhost:4173/Portofolio-website/id/      → portfolio (ID)
 *   http://localhost:4173/Portofolio-website/react/   → React demo
 *   http://localhost:4173/Portofolio-website/angular/ → Angular demo
 *   unknown paths → 404.html with status 404
 *
 * Usage: pnpm preview   (after `pnpm build:site`)
 * Local tool only — binds to 127.0.0.1 and serves read-only files.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startSiteServer } from './lib/site-server.mjs';
import { PAGES_BASE_PATH, SITE_DIR } from './site-apps.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', SITE_DIR);
const port = Number(process.env.PORT ?? 4173);

try {
  await startSiteServer({ root, basePath: PAGES_BASE_PATH, port });
  console.log(`[preview] http://localhost:${port}${PAGES_BASE_PATH}/  (Ctrl+C to stop)`);
} catch (error) {
  console.error(`[preview] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
