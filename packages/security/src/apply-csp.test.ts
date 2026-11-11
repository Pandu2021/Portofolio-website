/**
 * @file apply-csp.test.ts
 * Unit tests for the shared post-build Content-Security-Policy step.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyCsp, buildPolicy, sha256Source } from './apply-csp.mjs';

const page = (body: string, charset = '<meta charSet="utf-8"/>') =>
  `<!DOCTYPE html><html><head>${charset}<script>var a=1;</script></head><body>${body}<script src="/x.js"></script></body></html>`;

describe('apply-csp', () => {
  it('hashes inline scripts with SHA-256 (base64)', () => {
    const expected = createHash('sha256').update('var a=1;').digest('base64');
    expect(sha256Source('var a=1;')).toBe(`'sha256-${expected}'`);
  });

  it.each([
    ['Next.js style', '<meta charSet="utf-8"/>'],
    ['Vite / Angular style', '<meta charset="UTF-8" />'],
  ])('inserts the CSP right after <meta charset> (%s), before any script', (_label, charset) => {
    const { html, scripts } = applyCsp(page('<p>Hi</p>', charset));
    expect(scripts).toBe(1);
    const csp = html.indexOf('Content-Security-Policy');
    expect(csp).toBeGreaterThan(html.toLowerCase().indexOf('charset'));
    expect(csp).toBeLessThan(html.indexOf('<script'));
    expect(html).toContain(sha256Source('var a=1;'));
  });

  it('never allows unsafe-inline, eval or third-party origins', () => {
    const policy = buildPolicy(["'sha256-abc'"], []);
    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval|https?:/);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
  });

  it('replaces an existing policy instead of duplicating it', () => {
    const once = applyCsp(page('')).html;
    const twice = applyCsp(once).html;
    expect(twice.match(/Content-Security-Policy/g)).toHaveLength(1);
  });

  it('rejects inline style attributes', () => {
    expect(() => applyCsp(page('<div style="color:red">x</div>'))).toThrow(/Inline style/);
  });

  it('rejects inline event handlers', () => {
    expect(() => applyCsp(page('<link rel="stylesheet" href="a.css" onload="x()">'))).toThrow(
      /event handler/,
    );
  });

  it('fails closed when a script tag only appears after removing another one', () => {
    const html = page('<scr<script>x</script>ipt><div style="color:red">y</div></script>');
    expect(() => applyCsp(html)).toThrow(/Inline style/);
  });

  it('leaves external scripts and header-like tags alone', () => {
    const { html, scripts } = applyCsp(
      '<html><head><title>t</title></head><body><header>h</header><script src="/a.js"></script></body></html>',
    );
    expect(scripts).toBe(0);
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<title>'));
    expect(html).toContain('<header>h</header>');
  });

  it('stays fast on a document with many unterminated tags', () => {
    const started = performance.now();
    const { scripts } = applyCsp(`<head>${'<script '.repeat(20_000)}`);
    expect(scripts).toBe(0);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it('ignores style="…" text inside script bodies', () => {
    const html = page('<script>var s=\'<b style="x">\';</script>');
    expect(() => applyCsp(html)).not.toThrow();
  });
});
