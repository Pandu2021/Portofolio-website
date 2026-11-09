/**
 * @file eslint.config.js
 * Lint rules for @portfolio/security (shared base; this package is a CLI tool).
 */
import { baseConfig } from '@portfolio/config/eslint';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
];
