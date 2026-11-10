/**
 * @file eslint.config.js
 * Lint rules for the Vue invoice demo: shared base + eslint-plugin-vue
 * (recommended) with the TypeScript parser inside <script setup lang="ts">.
 */
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import { baseConfig } from '@portfolio/config/eslint';

export default [
  ...baseConfig,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
    rules: {
      // Security / CSP: never render raw HTML or inline styles.
      'vue/no-v-html': 'error',
      'vue/no-v-text-v-html-on-component': 'error',
      'vue/no-restricted-syntax': [
        'error',
        {
          selector: "VAttribute[key.argument.name='style']",
          message: 'No :style — use CSS classes (strict CSP).',
        },
        {
          selector: "VAttribute[key.name='style']",
          message: 'No style="" — use CSS classes (strict CSP).',
        },
      ],
      // Formatting is Prettier's job.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
];
