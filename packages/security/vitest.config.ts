/**
 * @file vitest.config.ts
 * Unit-test settings for @portfolio/security (plain Node environment).
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
