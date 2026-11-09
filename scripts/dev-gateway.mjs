/**
 * @file dev-gateway.mjs
 * Local development with the same URL layout as the live site:
 *
 *   http://localhost:3000/          → Next.js portfolio   (internal :3001)
 *   http://localhost:3000/react/    → Vite React demo     (internal :5173)
 *   http://localhost:3000/angular/  → Angular dashboard   (internal :4200)
 *
 * It starts every app's own dev server (from scripts/site-apps.mjs) and puts a
 * small reverse proxy in front of them, including WebSocket upgrades so hot
 * reload keeps working. One origin also means the theme choice (localStorage)
 * is shared between apps, exactly like on GitHub Pages.
 *
 * Usage:  pnpm dev                     all apps
 *         pnpm dev -- --only=react     gateway + only the listed apps (ids or sub-paths)
 *
 * Local tool only: listens on 127.0.0.1 and forwards to 127.0.0.1.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer, request } from 'node:http';
import { connect } from 'node:net';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { DEV_GATEWAY_PORT, SITE_APPS } from './site-apps.mjs';

/**
 * Picks the app that should answer a request path.
 * Sub-path apps (`/react/…`) win; everything else goes to the root app.
 *
 * @param {string} pathname  Request path, e.g. `/react/assets/x.js`.
 * @param {readonly {to: string, dev: {port: number}}[]} apps
 * @returns {{ app: {to: string, dev: {port: number}}, redirect?: string }}
 */
export function resolveTarget(pathname, apps = SITE_APPS) {
  for (const app of apps) {
    if (!app.to) continue;
    if (pathname === `/${app.to}`) return { app, redirect: `/${app.to}/` };
    if (pathname.startsWith(`/${app.to}/`)) return { app };
  }
  const root = apps.find((app) => app.to === '');
  if (!root) throw new Error('No root app ("to": "") in SITE_APPS');
  return { app: root };
}

/** Friendly page while an app's dev server is still starting. */
function starting(res, app) {
  res.writeHead(502, { 'content-type': 'text/html; charset=utf-8', 'retry-after': '2' });
  res.end(
    `<!doctype html><meta charset="utf-8"><title>Starting…</title>` +
      `<p>The <strong>${app.id}</strong> dev server (port ${app.dev.port}) is not ready yet.` +
      ` Refresh in a few seconds.</p>`,
  );
}

/**
 * Upstream host. `localhost` lets Node try IPv6 (::1) and IPv4 (127.0.0.1):
 * Vite and the Angular dev server listen on ::1 only on many systems.
 */
const UPSTREAM_HOST = 'localhost';

/** Creates the reverse proxy (HTTP + WebSocket upgrades); does not listen yet. */
function createGateway(apps) {
  const server = createServer((req, res) => {
    const { app, redirect } = resolveTarget(new URL(req.url ?? '/', 'http://x').pathname, apps);
    if (redirect) {
      res.writeHead(308, { location: redirect });
      return res.end();
    }
    const upstream = request(
      {
        host: UPSTREAM_HOST,
        port: app.dev.port,
        method: req.method,
        path: req.url,
        headers: req.headers,
      },
      (answer) => {
        res.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(res);
      },
    );
    upstream.on('error', () => (res.headersSent ? res.destroy() : starting(res, app)));
    req.pipe(upstream);
  });

  // Hot reload (Next.js, Vite and Angular use WebSockets).
  server.on('upgrade', (req, socket, head) => {
    const { app } = resolveTarget(new URL(req.url ?? '/', 'http://x').pathname, apps);
    const upstream = connect(
      { port: app.dev.port, host: UPSTREAM_HOST, autoSelectFamily: true },
      () => {
        const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
          lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
        }
        upstream.write(`${lines.join('\r\n')}\r\n\r\n`);
        if (head.length) upstream.write(head);
        socket.pipe(upstream).pipe(socket);
      },
    );
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
  });

  return server;
}

/**
 * Listens on BOTH loopback addresses (127.0.0.1 and ::1), so another local
 * server cannot silently answer `localhost:3000` instead of the gateway.
 * Rejects with a clear message when the port is already taken.
 */
function listenLoopback(handler, port) {
  const listenOn = (host) =>
    new Promise((resolveListen, rejectListen) => {
      const server = createServer();
      server.on('request', (req, res) => handler.emit('request', req, res));
      server.on('upgrade', (req, socket, head) => handler.emit('upgrade', req, socket, head));
      server.once('error', (error) => {
        // No IPv6 on this machine: IPv4 alone is fine.
        if (host === '::1' && error.code === 'EADDRNOTAVAIL') resolveListen(null);
        else rejectListen(error);
      });
      server.listen(port, host, () => resolveListen(server));
    });
  return Promise.all([listenOn('127.0.0.1'), listenOn('::1')]).then((servers) =>
    servers.filter(Boolean),
  );
}

/**
 * Starts one app's dev server through pnpm without a shell (no argument
 * injection). stdin is closed so a dev server can never wait for keyboard input.
 */
function startApp(app) {
  const args = ['--filter', app.dev.package, ...app.dev.args];
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NG_CLI_ANALYTICS: 'false' };
  // Some CLIs (e.g. Angular) prefer a PORT variable over --port; never leak it.
  delete env.PORT;
  const options = { stdio: /** @type {const} */ (['ignore', 'inherit', 'inherit']), env };

  // `pnpm dev` sets npm_execpath: either pnpm's native executable or its JS entry.
  const pnpmEntry = process.env.npm_execpath ?? '';
  if (/\.exe$/i.test(pnpmEntry)) return spawn(pnpmEntry, args, options);
  if (/\.c?js$/i.test(pnpmEntry)) return spawn(process.execPath, [pnpmEntry, ...args], options);
  // Fallback when started with plain `node scripts/dev-gateway.mjs`.
  return spawn('pnpm', args, { ...options, shell: process.platform === 'win32' });
}

/** Stops a child process and everything it started. */
function stop(child) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

/** CLI entry point. */
function main() {
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice('--only='.length).split(',') : null;
  const selected = SITE_APPS.filter(
    (app) => !only || only.includes(app.id) || only.includes(app.to || 'portfolio'),
  );

  // DEV_PORT (not PORT): PORT would also be picked up by the apps' own dev servers.
  const port = Number(process.env.DEV_PORT ?? DEV_GATEWAY_PORT);
  const gateway = createGateway(SITE_APPS);
  /** @type {import('node:child_process').ChildProcess[]} */
  let children = [];
  /** @type {import('node:http').Server[]} */
  let servers = [];

  const shutdown = (code = 0) => {
    servers.forEach((server) => server.close());
    children.forEach(stop);
    process.exit(code);
  };
  process.on('SIGINT', () => shutdown());
  process.on('SIGTERM', () => shutdown());

  // Claim the port first; only then start the dev servers.
  listenLoopback(gateway, port)
    .then((listening) => {
      servers = listening;
      children = selected.map(startApp);
      console.log('\n[dev] One URL for every app (same layout as the live site):');
      for (const app of selected) {
        console.log(`[dev]   http://localhost:${port}/${app.to ? `${app.to}/` : ''}  →  ${app.id}`);
      }
      console.log('[dev] Press Ctrl+C to stop all dev servers.\n');
    })
    .catch((error) => {
      console.error(
        error.code === 'EADDRINUSE'
          ? `[dev] Port ${port} is already in use — probably an older "next dev". Stop it (Ctrl+C in its terminal) and run "pnpm dev" again.`
          : `[dev] Gateway could not start on port ${port}: ${error.message}`,
      );
      shutdown(1);
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
