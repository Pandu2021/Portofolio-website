/**
 * @file theme.service.ts
 * Wraps the shared, framework-agnostic theme logic from
 * @portfolio/design-tokens in an Angular signal. Same stored choice as the
 * portfolio and the React demo (same origin).
 */
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  nextTheme,
  readStoredTheme,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@portfolio/design-tokens/theme';

/** Light / dark / system theme as a signal. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Current preference (`system` follows the OS). */
  readonly preference = signal<ThemePreference>(readStoredTheme());

  constructor() {
    // Also reacts to changes made in other tabs.
    const unsubscribe = subscribeTheme(() => this.preference.set(readStoredTheme()));
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  /** System → Light → Dark → System … */
  cycle(): void {
    setThemePreference(nextTheme(this.preference()));
  }
}
