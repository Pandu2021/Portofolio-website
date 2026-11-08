/**
 * @file eslint.config.js
 * Lint rules for the Angular dashboard:
 * shared base + angular-eslint (TypeScript, templates and template accessibility).
 */
import { defineConfig } from 'eslint/config';
import angular from 'angular-eslint';
import { baseConfig } from '@portfolio/config/eslint';

/** Scope the shared base to script files so it never runs on HTML templates. */
const scriptBase = baseConfig.map((config) =>
  'files' in config || Object.keys(config).join() === 'ignores'
    ? config
    : { ...config, files: ['**/*.ts', '**/*.js'] },
);

export default defineConfig([
  ...scriptBase,
  {
    files: ['**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      // Angular components/services are decorated classes that may have no members.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
]);
