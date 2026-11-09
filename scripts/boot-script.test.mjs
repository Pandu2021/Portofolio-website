/**
 * @file boot-script.test.mjs
 * The Angular demo cannot inject the theme boot script at build time, so its
 * index.html contains a copy. This test fails if the copy drifts from the
 * single source (packages/design-tokens/src/theme.ts) or ends up inside an
 * HTML comment.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { themeBootScript } from '../packages/design-tokens/src/theme.ts';

describe('theme boot script copies', () => {
  it('apps/angular-dashboard/src/index.html contains the exact shared script, outside comments', () => {
    const html = readFileSync(
      new URL('../apps/angular-dashboard/src/index.html', import.meta.url),
      'utf8',
    );
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    assert.ok(withoutComments.includes(`<script>${themeBootScript}</script>`));
  });
});
