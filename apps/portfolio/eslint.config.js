/**
 * @file eslint.config.js
 * Lint rules for the Next.js portfolio:
 * Next.js core-web-vitals + TypeScript presets, plus the shared project base.
 */
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { baseConfig } from '@portfolio/config/eslint';

export default defineConfig([
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts']),
]);
