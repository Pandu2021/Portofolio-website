/**
 * @file vite.config.ts
 * Vite + Vitest configuration for the React storefront demo.
 *
 * - Build: `base: './'` emits relative asset URLs, so the same build works at
 *   /Portofolio-website/react/ on GitHub Pages and in local preview.
 * - Dev: `base: '/react/'`, because `pnpm dev` (scripts/dev-gateway.mjs) serves
 *   this app at http://localhost:3000/react/ — the same layout as the live site.
 * - Routing uses the URL hash (#/cart), so no server rewrites are needed.
 * - The shared theme boot script is injected at the top of <head>, so a saved
 *   light/dark choice applies before the first paint (no flash). Its SHA-256
 *   hash is allowed by the CSP that `apply-csp` adds after the build.
 */
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';
// Subpath import: theme.ts has no relative imports, so Node can load it directly.
import { themeBootScript } from '@portfolio/design-tokens/theme';

/** Injects the theme boot script into index.html. */
function themeBoot(): Plugin {
  return {
    name: 'portfolio-theme-boot',
    transformIndexHtml: () => [
      { tag: 'script', children: themeBootScript, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/react/' : './',
  plugins: [react(), themeBoot()],
  server: { strictPort: true },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Never inline assets as data: URIs (Vite inlines files < 4 kB by default);
    // the CSP only allows fonts from our own origin (font-src 'self').
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
}));
