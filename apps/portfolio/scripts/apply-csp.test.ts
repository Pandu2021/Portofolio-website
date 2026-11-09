/**
 * @file apply-csp.test.ts
 * Unit tests for the post-build Content-Security-Policy step.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyCsp, buildPolicy, sha256Source } from './apply-csp';

const page = (body: string) =>
  `<!DOCTYPE html><html><head><meta charSet="utf-8"/><script>var a=1;</script></head><body>${body}<script src="/x.js"></script></body></html>`;

describe('apply-csp', () => {
  it('hashes inline scripts with SHA-256 (base64)', () => {
    const expected = createHash('sha256').update('var a=1;').digest('base64');
    expect(sha256Source('var a=1;')).toBe(`'sha256-${expected}'`);
  });

  it('inserts the CSP meta right after <meta charset>, before any script', () => {
    const { html, scripts } = applyCsp(page('<p>Hi</p>'));
    expect(scripts).toBe(1);
    const csp = html.indexOf('Content-Security-Policy');
    expect(csp).toBeGreaterThan(html.indexOf('charSet'));
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

  it('ignores the word style="…" inside script bodies', () => {
    const html = page('<script>var s=\'<b style="x">\';</script>');
    expect(() => applyCsp(html)).not.toThrow();
  });
});
