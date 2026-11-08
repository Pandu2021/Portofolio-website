/**
 * @file eslint.base.js
 * Shared ESLint flat-config building blocks for every workspace package.
 *
 * Each app composes these with its framework preset, e.g.
 *   import { baseConfig } from '@portfolio/config/eslint';
 *   export default [...baseConfig, ...frameworkConfig];
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Folders that are generated and must never be linted. */
export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/out/**',
    '**/.next/**',
    '**/.angular/**',
    '**/coverage/**',
    '**/_site/**',
    '**/next-env.d.ts',
  ],
};

/**
 * Recommended JavaScript + strict TypeScript rules, plus a few project rules
 * that protect code quality and security.
 */
export const baseConfig = [
  ignores,
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Security: forbid dynamic code execution.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // Quality
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Node scripts and config files may log to the console.
    files: ['**/*.config.{js,mjs,ts}', '**/scripts/**/*.{js,mjs,ts}'],
    rules: { 'no-console': 'off' },
  },
];
