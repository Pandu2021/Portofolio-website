/**
 * @file content.test.ts
 * Guards for website content:
 *  1. English and Indonesian files have exactly the same structure.
 *  2. Certificates point to existing images and official https verify pages.
 *  3. The showcase registry is consistent.
 *  4. PRIVACY: no e-mail addresses, phone numbers or ID-like numbers in content.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  certifications,
  formatMonthYear,
  getContent,
  isLocale,
  localePath,
  locales,
  showcase,
} from './index';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, 'data');
const portfolioPublic = join(here, '../../../apps/portfolio/public');

/**
 * Describes the "shape" of a JSON value (keys and array lengths, not text),
 * so two translations can be compared structurally.
 */
function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shapeOf);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shapeOf((value as Record<string, unknown>)[key])]),
    );
  }
  return typeof value;
}

describe('translations', () => {
  it('English and Indonesian content have the same structure', () => {
    expect(shapeOf(getContent('id'))).toEqual(shapeOf(getContent('en')));
  });

  it('every locale returns its own content', () => {
    for (const locale of locales) expect(getContent(locale).locale).toBe(locale);
  });

  it('helpers behave as documented', () => {
    expect(isLocale('id')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(localePath('en')).toBe('/');
    expect(localePath('id')).toBe('/id/');
    expect(formatMonthYear('2026-11-04', 'en')).toBe('Nov 2026');
  });
});

describe('certifications', () => {
  it('have unique ids and are sorted newest first', () => {
    const ids = certifications.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const dates = certifications.map((c) => c.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it.each(certifications)('$id has an existing image and a safe verify link', (cert) => {
    expect(existsSync(join(portfolioPublic, cert.image))).toBe(true);
    expect(cert.image).toMatch(/^certificates\/[a-z0-9-]+\.jpg$/);
    if (cert.verifyUrl !== null) {
      expect(cert.verifyUrl).toMatch(/^https:\/\/coursera\.org\/verify\/[a-z-]+\/[A-Z0-9]+$/);
    }
  });
});

describe('showcase registry', () => {
  it('has unique ids and paths', () => {
    expect(new Set(showcase.map((a) => a.id)).size).toBe(showcase.length);
    expect(new Set(showcase.map((a) => a.path)).size).toBe(showcase.length);
  });

  it('uses relative paths that end with a slash (or the home page)', () => {
    for (const app of showcase) expect(app.path).toMatch(/^$|^[a-z0-9-]+\/$/);
  });
});

describe('privacy', () => {
  const files = readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  const patterns: [string, RegExp][] = [
    ['e-mail address', /[\w.+-]+@[\w-]+\.[\w.]+/],
    ['Indonesian phone number', /(?:\+62|\b62|\b0)8\d{7,11}\b/],
    ['long ID-like number (e.g. student ID)', /\b\d{8,}\b/],
    ['direct messaging link', /wa\.me|whatsapp\.com|line\.me/i],
  ];

  it.each(files)('%s contains no private contact or identity data', (file) => {
    const text = readFileSync(join(dataDir, file), 'utf8');
    for (const [label, pattern] of patterns) {
      expect(pattern.test(text), `${file} contains a ${label}`).toBe(false);
    }
  });
});
