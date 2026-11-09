/**
 * @file next.config.ts
 * Next.js configuration for the main portfolio.
 *
 * - `output: 'export'` → pure static HTML in `out/` (GitHub Pages has no server).
 * - `basePath` → production builds live at https://pandu2021.github.io/Portofolio-website/;
 *   `next dev` uses no base path, so the site opens at http://localhost:3000/ (see src/lib/site.ts).
 * - `trailingSlash` → `/id/` is emitted as `id/index.html`, which GitHub Pages serves natively.
 */
import type { NextConfig } from 'next';
import { BASE_PATH } from './src/lib/site';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // The default image optimizer needs a server; certificate JPGs are pre-optimized instead.
  images: { unoptimized: true },
  experimental: {
    // One 404 page shared by both language root layouts: (en) and (id).
    globalNotFound: true,
  },
};

export default nextConfig;
