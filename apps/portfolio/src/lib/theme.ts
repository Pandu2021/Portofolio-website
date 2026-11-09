/**
 * @file theme.ts
 * Light / dark / system theme handling.
 *
 * - The preference is stored in localStorage (`system` = no stored value).
 * - `themeBootScript` runs inline in <head> before the first paint, so there is
 *   no flash of the wrong theme. Its SHA-256 hash is added to the
 *   Content-Security-Policy automatically by `scripts/apply-csp.ts`.
 * - React components read the preference through `useSyncExternalStore`
 *   (see {@link subscribeTheme} / {@link getThemeSnapshot}).
 */
import { THEME_STORAGE_KEY, type ThemePreference } from '@portfolio/design-tokens';

/** Order used by the toggle button: System → Light → Dark → System … */
export const THEME_CYCLE: readonly ThemePreference[] = ['system', 'light', 'dark'];

/**
 * Tiny script executed before the page renders:
 *  1. marks `<html class="js">` (enables scroll-reveal styles only when JS runs);
 *  2. applies a stored light/dark choice via `data-theme`.
 * Keep it dependency-free and short.
 */
export const themeBootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t)}}catch(e){}})();`;

/** Returns the preference that follows `current` in {@link THEME_CYCLE}. */
export function nextTheme(current: ThemePreference): ThemePreference {
  const index = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? 'system';
}

/**
 * Reads the stored preference. Falls back to `system` when storage is empty,
 * invalid or blocked (private mode, disabled cookies).
 */
export function readStoredTheme(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

const listeners = new Set<() => void>();

/**
 * Saves and applies a preference, then notifies subscribed components.
 * @param preference - `light`, `dark`, or `system` (follow the OS).
 */
export function setThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
  try {
    if (preference === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage blocked: the theme still applies for this page view.
  }
  listeners.forEach((listener) => listener());
}

/** `useSyncExternalStore` subscribe function (also reacts to other tabs). */
export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Client snapshot for `useSyncExternalStore`. */
export const getThemeSnapshot = readStoredTheme;

/** Server snapshot: static HTML always starts from `system`. */
export const getServerThemeSnapshot = (): ThemePreference => 'system';
