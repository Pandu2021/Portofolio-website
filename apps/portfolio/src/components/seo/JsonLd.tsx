/**
 * @file JsonLd.tsx
 * Emits schema.org structured data as an inline JSON-LD script.
 * The payload is escaped by `serializeJsonLd` (XSS hardening).
 */
import type { Locale } from '@portfolio/content';
import { buildPersonJsonLd, serializeJsonLd } from '@/lib/jsonld';

/** Person structured data for the given language. */
export function JsonLd({ locale }: { locale: Locale }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildPersonJsonLd(locale)) }}
    />
  );
}
