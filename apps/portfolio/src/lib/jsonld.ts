/**
 * @file jsonld.ts
 * Structured data (schema.org `Person`) for search engines and ATS parsers.
 */
import { certifications, getContent, localePath, localeTag, type Locale } from '@portfolio/content';
import { absoluteUrl } from './site';

/**
 * Builds the schema.org Person object for one language version of the page.
 * @param locale - Page language.
 */
export function buildPersonJsonLd(locale: Locale): Record<string, unknown> {
  const content = getContent(locale);
  const education = content.education.items[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: content.hero.name,
    jobTitle: 'Full-Stack Developer',
    description: content.meta.description,
    url: absoluteUrl(localePath(locale)),
    inLanguage: localeTag[locale],
    address: { '@type': 'PostalAddress', addressCountry: 'ID' },
    sameAs: content.contact.links.map((link) => link.href),
    knowsAbout: content.meta.keywords,
    knowsLanguage: content.about.languages.items.map((language) => ({
      '@type': 'Language',
      name: language.name,
      alternateName: language.code,
    })),
    ...(education && {
      alumniOf: { '@type': 'CollegeOrUniversity', name: education.school },
    }),
    hasCredential: certifications.map((cert) => ({
      '@type': 'EducationalOccupationalCredential',
      name: cert.name,
      credentialCategory: 'certificate',
      recognizedBy: { '@type': 'Organization', name: cert.issuer },
      dateCreated: cert.date,
      ...(cert.verifyUrl && { url: cert.verifyUrl }),
    })),
  };
}

/** U+2028 / U+2029 are valid in JSON but end a line in older JavaScript parsers. */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * Serializes JSON-LD safely for an inline `<script>`: escapes characters that
 * could close the script element or break parsing (XSS hardening).
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replaceAll(LINE_SEPARATOR, '\\u2028')
    .replaceAll(PARAGRAPH_SEPARATOR, '\\u2029');
}
