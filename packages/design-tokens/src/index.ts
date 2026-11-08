/**
 * @file index.ts
 * Design tokens that JavaScript needs at runtime (e.g. <meta name="theme-color">).
 * Keep these values in sync with tokens.css.
 */

/** Supported color themes. `system` follows the visitor's OS preference. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** localStorage key used by every app's theme toggle. */
export const THEME_STORAGE_KEY = 'portfolio-theme';

/** Browser UI colors (address bar on mobile) for each theme. */
export const themeColor = {
  light: '#fff8f1',
  dark: '#0b1220',
} as const;

/**
 * Light-theme brand colors for framework badges (text-safe on the cream background).
 * In CSS prefer the theme-aware `var(--brand-*)` tokens instead.
 */
export const frameworkColor = {
  next: '#0f172a',
  react: '#0a7090',
  angular: '#dd0031',
  vue: '#257a52',
} as const;

export type Framework = keyof typeof frameworkColor;
