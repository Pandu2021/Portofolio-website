/**
 * @file ThemeToggle.tsx
 * Cycles System → Light → Dark using the shared theme logic from
 * @portfolio/design-tokens (same stored choice as the main portfolio).
 */
import { useSyncExternalStore } from 'react';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  nextTheme,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@portfolio/design-tokens';
import { useI18n } from '../i18n/I18nContext';
import { Icon, type IconName } from './Icon';

const ICON: Record<ThemePreference, IconName> = { light: 'sun', dark: 'moon', system: 'monitor' };

/** Theme button whose accessible name always includes the current theme. */
export function ThemeToggle() {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const label = `${t.themeToggle}: ${{ light: t.themeLight, dark: t.themeDark, system: t.themeSystem }[theme]}`;
  return (
    <button
      type="button"
      className="icon-button"
      onClick={() => setThemePreference(nextTheme(theme))}
      aria-label={label}
      title={label}
    >
      <Icon name={ICON[theme]} size={20} />
    </button>
  );
}
