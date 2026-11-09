/**
 * @file RootDocument.tsx
 * The `<html>`/`<body>` shell shared by both language root layouts.
 *
 * - Each language has its own root layout, so `<html lang>` is correct in the
 *   static HTML (screen readers, search engines and ATS parsers rely on it).
 * - The theme boot script runs before first paint (no theme flash).
 *   `suppressHydrationWarning` is needed because that script may add
 *   `data-theme` / `class` to `<html>` before React hydrates.
 */
import type { ReactNode } from 'react';
import { localeTag, type Locale } from '@portfolio/content';
import { jakarta, jetbrainsMono } from '@/app/fonts';
import { themeBootScript } from '@/lib/theme';

interface RootDocumentProps {
  /** Page language. */
  locale: Locale;
  children: ReactNode;
}

/** Renders the document shell for one language. */
export function RootDocument({ locale, children }: RootDocumentProps) {
  return (
    <html lang={localeTag[locale]} suppressHydrationWarning>
      {/* App Router root layouts render <head> directly; next/head is Pages Router only. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      {/* Font classes define --font-jakarta / --font-jetbrains (used by site.css). */}
      <body id="top" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
