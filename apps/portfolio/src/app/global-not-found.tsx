/**
 * @file global-not-found.tsx
 * Bilingual 404 page for any unknown URL (exported as `out/404.html`,
 * which GitHub Pages serves automatically). No inline styles (strict CSP).
 */
import type { Metadata } from 'next';
import { themeBootScript } from '@/lib/theme';
import { BASE_PATH } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: '404 — Page not found | Halaman tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <main id="main" className="container section">
          <h1 className="section__title">404 — Page not found</h1>
          <p className="section__intro">
            <a href={`${BASE_PATH}/`}>Back to the home page</a>
          </p>
          <p className="section__intro" lang="id">
            Halaman tidak ditemukan. <a href={`${BASE_PATH}/id/`}>Kembali ke beranda</a>
          </p>
        </main>
      </body>
    </html>
  );
}
