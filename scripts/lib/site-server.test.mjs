/**
 * @file site-server.test.mjs
 * Safety rules of the local static server (Node's built-in test runner):
 * no path traversal, and malformed URLs must not crash it.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { startSiteServer } from './site-server.mjs';

const BASE = '/Portofolio-website';

describe('site server', () => {
  let root;
  let server;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'site-server-'));
    writeFileSync(join(root, 'index.html'), 'home');
    writeFileSync(join(root, '404.html'), 'not found');
    server = await startSiteServer({ root, basePath: BASE });
  });

  after(async () => {
    await server?.close();
    rmSync(root, { recursive: true, force: true });
  });

  /** Requests a raw path (fetch would normalize `..` itself). */
  const get = (path) => fetch(server.origin + path);

  it('serves the index below the base path', async () => {
    const res = await get(`${BASE}/`);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'home');
  });

  it('does not serve files outside the site root', async () => {
    for (const path of [`${BASE}/%2e%2e/%2e%2e/package.json`, `${BASE}/..%2f..%2fpackage.json`]) {
      const res = await get(path);
      assert.equal(res.status, 404, path);
      assert.equal(await res.text(), 'not found', path);
    }
  });

  it('answers 400 to malformed percent-encoding and keeps running', async () => {
    for (const path of [`${BASE}/%E0%A4%A`, `${BASE}/%`, `${BASE}/%zz`]) {
      const res = await get(path);
      assert.equal(res.status, 400, path);
      await res.text();
    }
    const res = await get(`${BASE}/`);
    assert.equal(res.status, 200);
    await res.text();
  });
});
