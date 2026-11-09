'use client';
/**
 * @file ThemeToggle.tsx
 * Button that cycles the color theme: System → Light → Dark.
 * The choice is saved in localStorage and applied to `<html data-theme>`.
 */
import { useSyncExternalStore } from 'react';
import type { ThemePreference } from '@portfolio/design-tokens';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  nextTheme,
  setThemePreference,
  subscribeTheme,
} from '@/lib/theme';
import { Icon, type IconName } from './Icon';

/** Localized labels for the toggle. */
export interface ThemeToggleLabels {
  toggle: string;
  light: string;
  dark: string;
  system: string;
}

const ICON: Record<ThemePreference, IconName> = { light: 'sun', dark: 'moon', system: 'monitor' };

/** Theme toggle button; its accessible name always states the current theme. */
export function ThemeToggle({ labels }: { labels: ThemeToggleLabels }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const current = labels[theme];

  return (
    <button
      type="button"
      className="icon-button"
      onClick={() => setThemePreference(nextTheme(theme))}
      aria-label={`${labels.toggle}: ${current}`}
      title={`${labels.toggle}: ${current}`}
      data-theme-choice={theme}
    >
      <Icon name={ICON[theme]} size={20} />
    </button>
  );
}
