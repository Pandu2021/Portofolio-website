/**
 * @file vitest.config.ts
 * Unit-test settings for the portfolio (pure helpers run in Node).
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
