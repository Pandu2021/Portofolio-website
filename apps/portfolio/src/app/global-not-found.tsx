/**
 * @file global-not-found.tsx
 * Bilingual 404 page for any unknown URL (exported as `out/404.html`,
 * which GitHub Pages serves automatically).
 */
import type { Metadata } from 'next';
import { BASE_PATH } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  title: '404 — Page not found | Halaman tidak ditemukan',
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main id="main" style={{ maxWidth: '40rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
          <h1>404 — Page not found</h1>
          <p>
            <a href={`${BASE_PATH}/`}>Back to the home page</a>
          </p>
          <p lang="id">
            Halaman tidak ditemukan. <a href={`${BASE_PATH}/id/`}>Kembali ke beranda</a>
          </p>
        </main>
      </body>
    </html>
  );
}
