/**
 * @file vitest.config.ts
 * Unit-test settings for the portfolio.
 * Default environment is Node; component tests opt into jsdom with a
 * `// @vitest-environment jsdom` comment at the top of the file.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // jsdom start-up on a busy machine or CI runner can exceed the 5 s default.
    testTimeout: 15_000,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
