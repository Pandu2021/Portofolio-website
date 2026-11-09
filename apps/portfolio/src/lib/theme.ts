/**
 * @file theme.ts
 * Theme handling for the portfolio — re-exported from @portfolio/design-tokens,
 * so all apps (Next.js, React, Angular) share one implementation and one
 * stored preference.
 */
export {
  THEME_CYCLE,
  getServerThemeSnapshot,
  getThemeSnapshot,
  nextTheme,
  readStoredTheme,
  setThemePreference,
  subscribeTheme,
  themeBootScript,
} from '@portfolio/design-tokens';
