/**
 * @file site-server.mjs
 * Static file server that behaves like GitHub Pages for the assembled `_site/`.
 * Shared by `pnpm preview`, the browser E2E tests and the Lighthouse audit.
 *
 *   /                          → 301 to /Portofolio-website/
 *   /Portofolio-website/id     → 301 to /Portofolio-website/id/   (trailing slash)
 *   /Portofolio-website/id/    → id/index.html
 *   unknown paths              → 404.html with status 404
 *
 * Read-only and path-traversal safe; listens on 127.0.0.1 only.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

/** Content types for every file type the site ships. */
export const MIME = {
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
 * Creates (but does not start) the server.
 * @param {{ root: string, basePath: string }} options
 *   root: folder to serve (e.g. `_site`); basePath: e.g. `/Portofolio-website`.
 * @returns {import('node:http').Server}
 */
export function createSiteServer({ root, basePath }) {
  const siteRoot = resolve(root);
  if (!existsSync(join(siteRoot, 'index.html'))) {
    throw new Error(`${siteRoot}/index.html not found. Run "pnpm build:site" first.`);
  }

  /** Maps a URL path below the base path to a file, or null if it escapes the root. */
  const resolveFile = (urlPath) => {
    const relative = decodeURIComponent(urlPath.slice(basePath.length)) || '/';
    const absolute = normalize(join(siteRoot, relative));
    return absolute === siteRoot || absolute.startsWith(siteRoot + sep) ? absolute : null;
  };

  const send = (res, status, file) => {
    res.writeHead(status, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  };

  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/' || url.pathname === basePath) {
      res.writeHead(301, { location: `${basePath}/` });
      return res.end();
    }
    const file = url.pathname.startsWith(`${basePath}/`) ? resolveFile(url.pathname) : null;
    if (file && existsSync(file)) {
      if (statSync(file).isDirectory()) {
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
    return send(res, 404, join(siteRoot, '404.html'));
  });
}

/**
 * Starts the server on a port (0 = any free port).
 * @param {{ root: string, basePath: string, port?: number }} options
 * @returns {Promise<{ origin: string, close: () => Promise<void> }>}
 *   origin: e.g. `http://127.0.0.1:51234`.
 */
export function startSiteServer({ root, basePath, port = 0 }) {
  const server = createSiteServer({ root, basePath });
  return new Promise((resolveStart, rejectStart) => {
    server.once('error', rejectStart);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      resolveStart({
        origin: `http://127.0.0.1:${actualPort}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
