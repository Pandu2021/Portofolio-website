/**
 * @file dev-gateway.test.mjs
 * Routing rules of the local dev gateway (Node's built-in test runner).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveTarget } from './dev-gateway.mjs';
import { SITE_APPS } from './site-apps.mjs';

const idOf = (pathname) => {
  const target = resolveTarget(pathname, SITE_APPS);
  return { id: target.app.id, redirect: target.redirect };
};

describe('dev gateway routing', () => {
  it('sends sub-paths to their app', () => {
    assert.deepEqual(idOf('/react/'), { id: 'react-storefront', redirect: undefined });
    assert.deepEqual(idOf('/react/assets/index.js'), {
      id: 'react-storefront',
      redirect: undefined,
    });
    assert.deepEqual(idOf('/angular/main.js'), { id: 'angular-dashboard', redirect: undefined });
  });

  it('adds the trailing slash to a bare sub-path', () => {
    assert.deepEqual(idOf('/react'), { id: 'react-storefront', redirect: '/react/' });
  });

  it('sends everything else to the portfolio', () => {
    for (const path of ['/', '/id/', '/_next/static/x.js', '/reactive', '/Resume_Public.pdf']) {
      assert.equal(idOf(path).id, 'portfolio', path);
    }
  });

  it('uses distinct internal ports that never clash with the gateway', () => {
    const ports = SITE_APPS.map((app) => app.dev.port);
    assert.equal(new Set(ports).size, ports.length);
    assert.ok(!ports.includes(3000));
  });
});
