/**
 * @file content.test.ts
 * Guards for website content:
 *  1. English and Indonesian files have exactly the same structure.
 *  2. Certificates point to existing images and official https verify pages.
 *  3. The showcase registry is consistent.
 *  4. Keywords: "one keyword, one home" — no duplicate skills, and project
 *     chips only use keywords from the Skills section.
 *  5. Course projects reference real certificates.
 *  6. PRIVACY: no e-mail addresses, phone numbers or ID-like numbers in content.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  certifications,
  courseProjects,
  formatMonthYear,
  getContent,
  isLocale,
  localePath,
  locales,
  showcase,
  skillKey,
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

/**
 * Reads the pixel size of a JPEG from its Start-Of-Frame marker, so declared
 * width/height in certifications.json can never drift from the real image.
 */
function jpegSize(buffer: Buffer): { width: number; height: number } {
  let offset = 2; // skip SOI marker (FFD8)
  while (offset < buffer.length) {
    const marker = buffer.readUInt16BE(offset);
    const length = buffer.readUInt16BE(offset + 2);
    // SOF0..SOF15 except DHT (C4), JPG (C8) and DAC (CC)
    if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('Not a valid JPEG');
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
  it('have unique ids and are sorted by month, newest first', () => {
    const ids = certifications.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const months = certifications.map((c) => c.date.slice(0, 7));
    expect(months).toEqual([...months].sort().reverse());
  });

  it('June 2025 follows the CV order', () => {
    const june2025 = certifications.filter((c) => c.date.startsWith('2025-06')).map((c) => c.id);
    expect(june2025).toEqual([
      'google-business-intelligence',
      'google-cybersecurity',
      'google-ux-design',
      'google-digital-marketing-ecommerce',
    ]);
  });

  it.each(certifications)('$id has an existing image and a safe verify link', (cert) => {
    const file = join(portfolioPublic, cert.image);
    expect(existsSync(file)).toBe(true);
    expect(jpegSize(readFileSync(file))).toEqual({ width: cert.width, height: cert.height });
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

describe('keywords: one keyword, one home', () => {
  it('normalizes keywords case-insensitively and without a trailing qualifier', () => {
    expect(skillKey('Kotlin (Android)')).toBe('kotlin');
    expect(skillKey('  REST APIs ')).toBe('rest apis');
  });

  it.each(locales)('%s: no keyword appears twice in the Skills section', (locale) => {
    const seen = new Map<string, string>();
    for (const group of getContent(locale).skills.groups) {
      for (const item of group.items) {
        const key = skillKey(item);
        expect(seen.has(key), `"${item}" in ${group.name} duplicates ${seen.get(key)}`).toBe(false);
        seen.set(key, group.name);
      }
    }
  });

  // Chips are technology names (English on both pages), so they are checked
  // against the English Skills list — for every project card, Tech Lab included.
  const englishSkills = new Set(
    getContent('en').skills.groups.flatMap((group) => group.items.map(skillKey)),
  );

  it.each(showcase)('$id (Tech Lab): at most 4 chips, all Skills keywords', (app) => {
    expect(app.stack.length).toBeLessThanOrEqual(4);
    for (const chip of app.stack) {
      expect(englishSkills.has(skillKey(chip)), `"${chip}" is not in Skills`).toBe(true);
    }
  });

  it.each(locales)('%s: featured-project chips are Skills keywords', (locale) => {
    for (const chip of getContent(locale).featuredProject.stack) {
      expect(englishSkills.has(skillKey(chip)), `"${chip}" is not in Skills`).toBe(true);
    }
  });

  it.each(courseProjects)('$id: at most 5 chips, all Skills keywords', (project) => {
    expect(project.stack.length).toBeLessThanOrEqual(5);
    for (const chip of project.stack) {
      expect(englishSkills.has(skillKey(chip)), `"${chip}" is not in Skills`).toBe(true);
    }
  });
});

describe('course projects', () => {
  it('have unique ids', () => {
    const ids = courseProjects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(courseProjects)('$id matches its certificate year and status', (project) => {
    const cert = certifications.find((c) => c.id === project.certificationId);
    if (cert) {
      expect(cert.date.slice(0, 4)).toBe(project.year);
      expect(project.status).toBe('completed');
    } else {
      // No certificate yet → the program must be named and marked in progress.
      expect(project.program).toBeTruthy();
      expect(project.status).toBe('in-progress');
    }
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
