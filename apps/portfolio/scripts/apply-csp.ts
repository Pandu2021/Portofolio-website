/**
 * @file apply-csp.ts
 * Post-build step: injects a strict Content-Security-Policy `<meta>` into every
 * exported HTML file in `out/`.
 *
 * Why a post-build step? GitHub Pages cannot send HTTP headers, and Next.js
 * inlines small `<script>` tags (page data, our theme boot script, JSON-LD).
 * Instead of allowing *all* inline scripts (`'unsafe-inline'`), we hash each
 * one with SHA-256 and allow exactly those.
 *
 * It also fails the build if any `style="…"` attribute is found, because the
 * policy does not allow inline style attributes.
 *
 * Usage (Node ≥ 22.18 runs TypeScript directly): `node scripts/apply-csp.ts out`
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const INLINE_STYLE = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const EXISTING_CSP = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;
const CHARSET_META = /<meta charSet="utf-8"\s*\/?>|<meta charset="utf-8"\s*\/?>/i;

/** CSP source expression for a SHA-256 hash of `text`. */
export function sha256Source(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/** Collects unique hash sources for every match of `pattern` (group 1 = body). */
function hashesOf(html: string, pattern: RegExp): string[] {
  const sources = new Set<string>();
  for (const match of html.matchAll(pattern)) {
    const body = match[1] ?? '';
    if (body.trim()) sources.add(sha256Source(body));
  }
  return [...sources];
}

/**
 * Builds the policy string. No third-party origins are allowed at all.
 * Note: `frame-ancestors` cannot be set from a `<meta>` tag (header only).
 */
export function buildPolicy(scriptHashes: string[], styleHashes: string[]): string {
  return [
    "default-src 'self'",
    ['script-src', "'self'", ...scriptHashes].join(' '),
    ['style-src', "'self'", ...styleHashes].join(' '),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/** Result of processing one HTML document. */
export interface CspResult {
  html: string;
  scripts: number;
  styles: number;
}

/**
 * Adds (or replaces) the CSP meta tag in one HTML document.
 * @throws Error if the document contains inline `style` attributes.
 */
export function applyCsp(html: string): CspResult {
  const withoutScripts = html.replace(INLINE_SCRIPT, '');
  if (/<[a-z][^>]*\sstyle="/i.test(withoutScripts)) {
    throw new Error('Inline style attribute found — it would be blocked by the CSP.');
  }

  const scripts = hashesOf(html, INLINE_SCRIPT);
  const styles = hashesOf(html, INLINE_STYLE);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildPolicy(scripts, styles)}"/>`;

  let output: string;
  if (EXISTING_CSP.test(html)) {
    output = html.replace(EXISTING_CSP, meta);
  } else if (CHARSET_META.test(html)) {
    // Right after <meta charset>, i.e. before any script in <head>.
    output = html.replace(CHARSET_META, (charset) => `${charset}${meta}`);
  } else {
    output = html.replace(/<head[^>]*>/i, (head) => `${head}${meta}`);
  }
  return { html: output, scripts: scripts.length, styles: styles.length };
}

/** Recursively lists every `.html` file below `dir`. */
export function listHtmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

/** CLI entry point. */
function main(): void {
  const outDir = resolve(process.argv[2] ?? 'out');
  const files = listHtmlFiles(outDir);
  if (files.length === 0) throw new Error(`No HTML files found in ${outDir}`);

  for (const file of files) {
    const result = applyCsp(readFileSync(file, 'utf8'));
    writeFileSync(file, result.html);
    console.log(`[csp] ${file.slice(outDir.length + 1)}: ${result.scripts} inline script hash(es)`);
  }
  console.log(`[csp] Content-Security-Policy applied to ${files.length} HTML file(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
