/**
 * @file RootDocument.tsx
 * The `<html>`/`<body>` shell shared by both language root layouts.
 * Each language has its own root layout so `<html lang>` is correct in the
 * static HTML (important for screen readers, search engines and ATS parsers).
 */
import type { ReactNode } from 'react';
import { localeTag, type Locale } from '@portfolio/content';

interface RootDocumentProps {
  /** Page language. */
  locale: Locale;
  children: ReactNode;
}

/** Renders the document shell for one language. */
export function RootDocument({ locale, children }: RootDocumentProps) {
  return (
    <html lang={localeTag[locale]}>
      <body>{children}</body>
    </html>
  );
}
