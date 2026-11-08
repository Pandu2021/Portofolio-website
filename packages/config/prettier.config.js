/**
 * @file prettier.config.js
 * Shared code-formatting rules (used by the root prettier.config.js).
 *
 * @type {import('prettier').Config}
 */
const config = {
  printWidth: 100,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      // Angular templates use the dedicated parser.
      files: 'apps/angular-dashboard/src/**/*.html',
      options: { parser: 'angular' },
    },
  ],
};

export default config;
