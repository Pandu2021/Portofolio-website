/**
 * @file eslint.config.js
 * Lint rules for the React storefront: shared base + React Hooks + Fast Refresh.
 */
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { baseConfig } from '@portfolio/config/eslint';

export default [
  ...baseConfig,
  reactHooks.configs.flat['recommended-latest'] ?? reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          // Provider + hook in one file is intentional (context stays private).
          allowExportNames: ['useI18n', 'useCart', 'useAnnounce', 'detectLocale'],
        },
      ],
    },
  },
];
