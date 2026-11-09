/**
 * @file jsonld.test.ts
 * Structured data is complete and safely escaped.
 */
import { describe, expect, it } from 'vitest';
import { buildPersonJsonLd, serializeJsonLd } from './jsonld';

describe('JSON-LD', () => {
  it('describes a Person with skills, profiles and credentials', () => {
    const data = buildPersonJsonLd('en');
    expect(data['@type']).toBe('Person');
    expect(data['name']).toBe('Pandu Wicaksono');
    expect(data['knowsAbout']).toContain('React');
    expect(data['knowsAbout']).toContain('Angular');
    expect(data['sameAs']).toContain('https://github.com/Pandu2021');
    expect(Array.isArray(data['hasCredential'])).toBe(true);
    expect(data['url']).toBe('https://pandu2021.github.io/Portofolio-website/');
  });

  it('uses the Indonesian URL for the Indonesian page', () => {
    expect(buildPersonJsonLd('id')['url']).toBe(
      'https://pandu2021.github.io/Portofolio-website/id/',
    );
  });

  it('escapes characters that could break out of the <script> tag', () => {
    const output = serializeJsonLd({ text: '</script><script>alert(1)</script> & more' });
    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(JSON.parse(output)).toEqual({ text: '</script><script>alert(1)</script> & more' });
  });

  it('escapes U+2028 / U+2029 line separators', () => {
    const separators = String.fromCharCode(0x2028) + String.fromCharCode(0x2029);
    const output = serializeJsonLd({ text: separators });
    expect(output).toBe('{"text":"\\u2028\\u2029"}');
    expect(JSON.parse(output)).toEqual({ text: separators });
  });
});
