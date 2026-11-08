/**
 * @file metadata.ts
 * Builds per-language SEO metadata (title, description, canonical URL,
 * hreflang alternates and Open Graph) from @portfolio/content.
 */
import type { Metadata, Viewport } from 'next';
import { getContent, localePath, localeTag, type Locale } from '@portfolio/content';
import { themeColor } from '@portfolio/design-tokens';
import { SITE_URL, absoluteUrl } from './site';

/**
 * Next.js `metadata` export for one language version of the home page.
 * @param locale - Page language.
 */
export function buildMetadata(locale: Locale): Metadata {
  const { meta } = getContent(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: 'Pandu Wicaksono' }],
    alternates: {
      canonical: absoluteUrl(localePath(locale)),
      languages: {
        en: absoluteUrl(localePath('en')),
        id: absoluteUrl(localePath('id')),
        'x-default': absoluteUrl(localePath('en')),
      },
    },
    openGraph: {
      type: 'profile',
      url: absoluteUrl(localePath(locale)),
      title: meta.title,
      description: meta.description,
      locale: localeTag[locale].replace('-', '_'),
      siteName: 'Pandu Wicaksono',
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

/** Browser UI colors that follow the visitor's color scheme. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: themeColor.dark },
  ],
};
