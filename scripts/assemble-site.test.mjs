/**
 * @file assemble-site.test.mjs
 * Tests for the site assembler (Node's built-in test runner: `node --test scripts/`).
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { assembleSite, assertShowcaseCovered } from './assemble-site.mjs';

const root = mkdtempSync(join(tmpdir(), 'assemble-'));
after(() => rmSync(root, { recursive: true, force: true }));

/** Creates a fake build folder with an index.html. */
function fakeBuild(folder, html = '<h1>ok</h1>') {
  mkdirSync(join(root, folder), { recursive: true });
  writeFileSync(join(root, folder, 'index.html'), html);
}

describe('assembleSite', () => {
  it('copies the root app and sub-path apps, and writes .nojekyll', () => {
    fakeBuild('a/out', 'home');
    fakeBuild('b/dist', 'react');
    const apps = [
      { id: 'b', from: 'b/dist', to: 'react' },
      { id: 'a', from: 'a/out', to: '' },
    ];
    assembleSite({ root, outDir: '_site', apps });
    assert.equal(readFileSync(join(root, '_site/index.html'), 'utf8'), 'home');
    assert.equal(readFileSync(join(root, '_site/react/index.html'), 'utf8'), 'react');
    assert.ok(existsSync(join(root, '_site/.nojekyll')));
  });

  it('fails when an app has not been built', () => {
    const apps = [{ id: 'missing', from: 'nope/dist', to: '' }];
    assert.throws(() => assembleSite({ root, outDir: '_x', apps }), /index\.html not found/);
  });

  it('fails when two apps would write to the same folder', () => {
    fakeBuild('c/out');
    mkdirSync(join(root, 'c/out/react'), { recursive: true });
    fakeBuild('d/dist');
    const apps = [
      { id: 'c', from: 'c/out', to: '' },
      { id: 'd', from: 'd/dist', to: 'react' },
    ];
    assert.throws(() => assembleSite({ root, outDir: '_y', apps }), /path collision/);
  });
});

describe('assertShowcaseCovered', () => {
  const apps = [{ to: '' }, { to: 'react' }];

  it('accepts live apps that are published and ignores planned ones', () => {
    assert.doesNotThrow(() =>
      assertShowcaseCovered(apps, [
        { id: 'home', path: '', status: 'live' },
        { id: 'react', path: 'react/', status: 'in-progress' },
        { id: 'vue', path: 'vue/', status: 'planned' },
      ]),
    );
  });

  it('rejects a live app with no published folder', () => {
    assert.throws(
      () => assertShowcaseCovered(apps, [{ id: 'ng', path: 'angular/', status: 'live' }]),
      /angular\//,
    );
  });
});
