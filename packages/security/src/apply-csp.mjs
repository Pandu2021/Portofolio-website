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

const TAG_START = /<[a-z]/i;
const STYLE_ATTRIBUTE = /\sstyle="/i;
const EVENT_HANDLER = /\son[a-z]+="/i;
const EXISTING_CSP_START = /<meta http-equiv="Content-Security-Policy"/i;
const HEAD_START = /<head(?=[\s/>])/i;
const CHARSET_META = /<meta charset="utf-8"\s*\/?>/i;

/**
 * Finds every inline `<tag …>body</tag>` element (one without a `src`
 * attribute), scanning the document once from left to right.
 *
 * Plain regular expressions such as `<script[^>]*>([\s\S]*?)<\/script>` can
 * take quadratic time on a document with many unterminated tags (CodeQL rule
 * js/polynomial-redos). Here every search moves forward only, and stops as
 * soon as a search finds nothing, because no later search can succeed either.
 * @param {string} html
 * @param {'script' | 'style'} tag
 * @returns {{ start: number, end: number, body: string }[]}
 */
function findInlineElements(html, tag) {
  const open = new RegExp(`<${tag}(?=[\\s/>])`, 'gi');
  const close = new RegExp(`</${tag}>`, 'gi');
  /** @type {{ start: number, end: number, body: string }[]} */
  const found = [];
  let from = 0;
  for (;;) {
    open.lastIndex = from;
    const opening = open.exec(html);
    if (!opening) break;
    const tagEnd = html.indexOf('>', opening.index);
    if (tagEnd === -1) break;
    const attributes = html.slice(opening.index + opening[0].length, tagEnd);
    if (/\ssrc=/.test(attributes)) {
      from = tagEnd + 1; // external script: nothing to hash or hide
      continue;
    }
    close.lastIndex = tagEnd + 1;
    const closing = close.exec(html);
    if (!closing) break;
    const end = closing.index + closing[0].length;
    found.push({ start: opening.index, end, body: html.slice(tagEnd + 1, closing.index) });
    from = end;
  }
  return found;
}

/**
 * True if some tag carries an attribute matching `attribute` (same result as
 * `/<[a-z][^>]*ATTRIBUTE/i`, but in linear time).
 *
 * The text is cut at every ">". A match must lie inside one such piece,
 * after its first "<letter": if the first one does not lead to the attribute,
 * a later one in the same piece cannot either.
 * @param {string} html
 * @param {RegExp} attribute Pattern for the attribute (no `g` flag).
 * @returns {boolean}
 */
function hasTagAttribute(html, attribute) {
  let from = 0;
  while (from <= html.length) {
    const found = html.indexOf('>', from);
    const end = found === -1 ? html.length : found;
    const piece = html.slice(from, end);
    const tag = TAG_START.exec(piece);
    if (tag && attribute.test(piece.slice(tag.index + 2))) return true;
    from = end + 1;
  }
  return false;
}

/**
 * The document without its inline `<script>` elements, removed in one pass
 * over the original text. Text that only turns into a tag after a removal
 * (`<scr<script></script>ipt>`) stays visible to the checks below, so such a
 * document fails the build instead of being hidden from them.
 * @param {string} html
 * @returns {string}
 */
function withoutInlineScripts(html) {
  let result = '';
  let position = 0;
  for (const { start, end } of findInlineElements(html, 'script')) {
    result += html.slice(position, start);
    position = end;
  }
  return result + html.slice(position);
}

/**
 * Replaces the first `<tag …>` match of `start` (everything up to the next `>`)
 * with `replacement`. Returns `null` if there is no complete tag.
 * @param {string} html
 * @param {RegExp} start Matches the beginning of the tag (no `g` flag).
 * @param {(tag: string) => string} replacement
 * @returns {string | null}
 */
function replaceTag(html, start, replacement) {
  const opening = start.exec(html);
  if (!opening) return null;
  const tagEnd = html.indexOf('>', opening.index);
  if (tagEnd === -1) return null;
  return (
    html.slice(0, opening.index) +
    replacement(html.slice(opening.index, tagEnd + 1)) +
    html.slice(tagEnd + 1)
  );
}

/**
 * CSP source expression for the SHA-256 hash of `text`.
 * @param {string} text Exact script or style body.
 * @returns {string} e.g. `'sha256-abc…='`
 */
export function sha256Source(text) {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/**
 * Unique hash sources for the body of every inline `<tag>` element.
 * @param {string} html
 * @param {'script' | 'style'} tag
 * @returns {string[]}
 */
function hashesOf(html, tag) {
  const sources = new Set();
  for (const { body } of findInlineElements(html, tag)) {
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
  const withoutScripts = withoutInlineScripts(html);
  if (hasTagAttribute(withoutScripts, STYLE_ATTRIBUTE)) {
    throw new Error('Inline style attribute found — it would be blocked by the CSP.');
  }
  if (hasTagAttribute(withoutScripts, EVENT_HANDLER)) {
    throw new Error('Inline event handler (on…="") found — it would be blocked by the CSP.');
  }

  const scripts = hashesOf(html, 'script');
  const styles = hashesOf(html, 'style');
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildPolicy(scripts, styles)}"/>`;

  const output =
    // Replace a policy that is already there ...
    replaceTag(html, EXISTING_CSP_START, () => meta) ??
    // ... else right after <meta charset>, i.e. before any script in <head> ...
    (CHARSET_META.test(html)
      ? html.replace(CHARSET_META, (charset) => `${charset}${meta}`)
      : // ... else right after <head>.
        replaceTag(html, HEAD_START, (head) => `${head}${meta}`)) ??
    html;
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
