#!/usr/bin/env node
// @ts-check
/**
 * @file apply-csp.mjs
 * Post-build step shared by every app: injects a strict Content-Security-Policy
 * `<meta>` into every HTML file of a static build folder.
 *
 * Why? GitHub Pages cannot send HTTP headers, and frameworks inline small
 * `<script>` tags (page data, theme boot script, JSON-LD). Instead of allowing
 * *all* inline scripts (`'unsafe-inline'`), each one is hashed with SHA-256 and
 * only those exact scripts are allowed.
 *
 * The build fails if an inline `style="…"` attribute or an inline event handler
 * (`onload="…"`, `onclick="…"`) is found, because the policy blocks both.
 *
 * Usage (from an app folder):  apply-csp <buildDir>      e.g. `apply-csp out`
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const INLINE_STYLE = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTRIBUTE = /<[a-z][^>]*\sstyle="/i;
const EVENT_HANDLER = /<[a-z][^>]*\son[a-z]+="/i;
const EXISTING_CSP = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;
const CHARSET_META = /<meta charset="utf-8"\s*\/?>/i;

/**
 * CSP source expression for the SHA-256 hash of `text`.
 * @param {string} text Exact script or style body.
 * @returns {string} e.g. `'sha256-abc…='`
 */
export function sha256Source(text) {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/**
 * Unique hash sources for every match of `pattern` (capture group 1 = body).
 * @param {string} html
 * @param {RegExp} pattern
 * @returns {string[]}
 */
function hashesOf(html, pattern) {
  const sources = new Set();
  for (const match of html.matchAll(pattern)) {
    const body = match[1] ?? '';
    if (body.trim()) sources.add(sha256Source(body));
  }
  return [...sources];
}

/**
 * Builds the policy string. No third-party origins are allowed at all.
 * `frame-ancestors` cannot be set from a `<meta>` tag (HTTP header only).
 * @param {string[]} scriptHashes
 * @param {string[]} styleHashes
 * @returns {string}
 */
export function buildPolicy(scriptHashes, styleHashes) {
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

/**
 * Adds (or replaces) the CSP meta tag in one HTML document.
 * @param {string} html
 * @returns {{ html: string, scripts: number, styles: number }}
 * @throws {Error} If the document contains inline style attributes or event handlers.
 */
export function applyCsp(html) {
  const withoutScripts = html.replace(INLINE_SCRIPT, '');
  if (STYLE_ATTRIBUTE.test(withoutScripts)) {
    throw new Error('Inline style attribute found — it would be blocked by the CSP.');
  }
  if (EVENT_HANDLER.test(withoutScripts)) {
    throw new Error('Inline event handler (on…="") found — it would be blocked by the CSP.');
  }

  const scripts = hashesOf(html, INLINE_SCRIPT);
  const styles = hashesOf(html, INLINE_STYLE);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildPolicy(scripts, styles)}"/>`;

  let output;
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

/**
 * Recursively lists every `.html` file below `dir`.
 * @param {string} dir
 * @returns {string[]}
 */
export function listHtmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listHtmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

/**
 * Applies the CSP to every HTML file in `buildDir` and logs a summary.
 * @param {string} buildDir
 */
export function applyCspToDirectory(buildDir) {
  const outDir = resolve(buildDir);
  const files = listHtmlFiles(outDir);
  if (files.length === 0) throw new Error(`No HTML files found in ${outDir}`);
  for (const file of files) {
    const result = applyCsp(readFileSync(file, 'utf8'));
    writeFileSync(file, result.html);
    console.log(`[csp] ${file.slice(outDir.length + 1)}: ${result.scripts} inline script hash(es)`);
  }
  console.log(`[csp] Content-Security-Policy applied to ${files.length} HTML file(s).`);
}

// CLI: run only when executed directly (also through the pnpm bin shim).
const invoked = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (invoked === fileURLToPath(import.meta.url)) {
  try {
    applyCspToDirectory(process.argv[2] ?? 'dist');
  } catch (error) {
    console.error(`[csp] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
