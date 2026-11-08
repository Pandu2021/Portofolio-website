/**
 * @file vite.config.ts
 * Vite + Vitest configuration for the React storefront demo.
 *
 * `base: './'` emits relative asset URLs, so the same build works at
 * /Portofolio-website/react/ on GitHub Pages and in local preview.
 * Routing uses the URL hash (#/cart), so no server rewrites are needed.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
