// @vitest-environment jsdom
/**
 * @file ThemeToggle.test.tsx
 * The theme toggle cycles System → Light → Dark, updates <html data-theme>,
 * persists the choice and always announces the current theme.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY } from '@portfolio/design-tokens';
import { themeBootScript } from '@/lib/theme';
import { ThemeToggle } from './ThemeToggle';

const labels = { toggle: 'Change color theme', light: 'Light', dark: 'Dark', system: 'System' };

describe('<ThemeToggle />', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(cleanup);

  it('starts on "System" when nothing is stored', () => {
    render(<ThemeToggle labels={labels} />);
    expect(screen.getByRole('button', { name: 'Change color theme: System' })).toBeTruthy();
  });

  it('cycles System → Light → Dark → System and persists the choice', () => {
    render(<ThemeToggle labels={labels} />);
    const button = screen.getByRole('button');

    act(() => fireEvent.click(button));
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(button.getAttribute('aria-label')).toBe('Change color theme: Light');

    act(() => fireEvent.click(button));
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Change color theme: Dark');

    act(() => fireEvent.click(button));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('boot script applies a stored theme before React runs', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    // Execute the exact inline script that ships in <head> (test-only, trusted constant).
    // eslint-disable-next-line no-new-func
    new Function(themeBootScript)();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.classList.contains('js')).toBe(true);
  });
});
