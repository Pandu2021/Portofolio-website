/**
 * @file vite.config.ts
 * Vite + Vitest configuration for the Vue invoice & pricing demo.
 *
 * - Build: `base: './'` emits relative asset URLs, so the same build works at
 *   /Portofolio-website/vue/ on GitHub Pages and in local preview.
 * - Dev: `base: '/vue/'`, because `pnpm dev` (scripts/dev-gateway.mjs) serves
 *   this app at http://localhost:3000/vue/ — the same layout as the live site.
 * - Routing uses the URL hash (#/invoices), so no server rewrites are needed.
 * - Templates are compiled at build time by @vitejs/plugin-vue, so the
 *   runtime-only Vue build is used: no `new Function`, CSP-safe.
 * - The shared theme boot script is injected at the top of <head> (no theme
 *   flash); `apply-csp` allows it by SHA-256 hash after the build.
 */
import vue from '@vitejs/plugin-vue';
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
  base: command === 'serve' ? '/vue/' : './',
  plugins: [vue(), themeBoot()],
  define: {
    // Composition API only: drop the Options API and production devtools hooks.
    __VUE_OPTIONS_API__: 'false',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  server: { strictPort: true },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Never inline assets as data: URIs; the CSP only allows our own origin.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    testTimeout: 15_000,
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/stores/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text-summary'],
      // The pricing engine is the core of the demo: keep it fully tested.
      thresholds: { 'src/lib/pricing.ts': { lines: 90, branches: 90, functions: 90 } },
    },
  },
}));
