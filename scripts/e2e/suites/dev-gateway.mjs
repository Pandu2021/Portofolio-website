/**
 * @file dev-gateway.mjs
 * Checks a running `pnpm dev` gateway (read-only): every app renders through
 * http://localhost:3000/ and its hot-reload WebSocket connects through the proxy.
 * Start `pnpm dev` yourself first; this suite never starts or stops servers.
 */
import { openPage, sleep } from '../harness.mjs';

const PAGES = [
  ['portfolio', ''],
  ['react', 'react/'],
  ['angular', 'angular/#/login'],
];

/**
 * @param {{ browser: import('puppeteer-core').Browser, results: import('../harness.mjs').Results, base: string }} context
 */
export async function run({ browser, results, base }) {
  for (const [name, path] of PAGES) {
    const view = await openPage(browser, base + path);
    // Watch WebSockets through the DevTools protocol, then reload so the
    // hot-reload client connects again while we are listening.
    /** @type {{ url: string, open: boolean }[]} */
    const sockets = [];
    const cdp = await view.page.createCDPSession();
    await cdp.send('Network.enable');
    cdp.on('Network.webSocketCreated', (event) => sockets.push({ url: event.url, open: false }));
    cdp.on('Network.webSocketHandshakeResponseReceived', (event) => {
      const socket = sockets.at(-1);
      if (socket) socket.open = event.response.status === 101;
    });
    await view.page.reload({ waitUntil: 'networkidle0' });
    await sleep(1500);
    const heading = await view.page.evaluate(
      () => document.querySelector('h1')?.textContent?.trim() ?? '',
    );
    results.check(Boolean(heading), `${name} renders through the gateway`, heading);
    results.check(
      view.errors.length === 0,
      `${name} has no console or HTTP errors`,
      view.errors.join(' | ').slice(0, 200),
    );
    results.check(
      sockets.some((socket) => socket.open),
      `${name} hot-reload WebSocket connects through the gateway`,
      sockets.map((socket) => socket.url).join(', '),
    );
    await view.close();
  }
}
