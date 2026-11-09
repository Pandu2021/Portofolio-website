/**
 * @file preview-site.mjs
 * Serves the assembled `_site/` locally exactly like GitHub Pages will:
 *
 *   http://localhost:4173/                      → redirects to /Portofolio-website/
 *   http://localhost:4173/Portofolio-website/   → portfolio (EN)
 *   http://localhost:4173/Portofolio-website/id/      → portfolio (ID)
 *   http://localhost:4173/Portofolio-website/react/   → React demo
 *   http://localhost:4173/Portofolio-website/angular/ → Angular demo
 *   unknown paths → 404.html with status 404
 *
 * Usage: pnpm preview   (after `pnpm build && pnpm assemble`)
 * Local tool only — binds to 127.0.0.1 and serves read-only files.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES_BASE_PATH, SITE_DIR } from './site-apps.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', SITE_DIR);
const PORT = Number(process.env.PORT ?? 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

/**
 * Maps a URL path below the base path to a file inside `_site/`.
 * Returns `null` for anything outside the folder (path-traversal protection).
 */
function resolveFile(urlPath) {
  const relative = decodeURIComponent(urlPath.slice(PAGES_BASE_PATH.length)) || '/';
  const absolute = normalize(join(ROOT, relative));
  return absolute === ROOT || absolute.startsWith(ROOT + sep) ? absolute : null;
}

/** Streams a file with its content type and status code. */
function send(res, status, file) {
  res.writeHead(status, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`[preview] ${SITE_DIR}/ not found. Run "pnpm build && pnpm assemble" first.`);
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  // Like the live site: the project lives under /Portofolio-website/.
  if (url.pathname === '/' || url.pathname === PAGES_BASE_PATH) {
    res.writeHead(301, { location: `${PAGES_BASE_PATH}/` });
    return res.end();
  }

  const file = url.pathname.startsWith(`${PAGES_BASE_PATH}/`) ? resolveFile(url.pathname) : null;
  if (file && existsSync(file)) {
    if (statSync(file).isDirectory()) {
      // GitHub Pages adds the trailing slash to folders: /id → /id/
      if (!url.pathname.endsWith('/')) {
        res.writeHead(301, { location: `${url.pathname}/` });
        return res.end();
      }
      const index = join(file, 'index.html');
      if (existsSync(index)) return send(res, 200, index);
    } else {
      return send(res, 200, file);
    }
  }
  return send(res, 404, join(ROOT, '404.html'));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`[preview] http://localhost:${PORT}${PAGES_BASE_PATH}/  (Ctrl+C to stop)`);
});
