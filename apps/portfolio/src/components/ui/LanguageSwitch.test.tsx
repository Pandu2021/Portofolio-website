// @vitest-environment jsdom
/**
 * @file LanguageSwitch.test.tsx
 * The language switch links to both static language pages (with the GitHub
 * Pages base path) and marks the current language.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguageSwitch } from './LanguageSwitch';

afterEach(cleanup);

describe('<LanguageSwitch />', () => {
  it('links to the English and Indonesian pages', () => {
    render(<LanguageSwitch locale="en" label="Language" />);
    const english = screen.getByRole('link', { name: /EN/ });
    const indonesian = screen.getByRole('link', { name: /ID/ });
    expect(english.getAttribute('href')).toBe('/Portofolio-website/');
    expect(indonesian.getAttribute('href')).toBe('/Portofolio-website/id/');
    expect(indonesian.getAttribute('hreflang')).toBe('id-ID');
  });

  it('marks the current language with aria-current', () => {
    render(<LanguageSwitch locale="id" label="Bahasa" />);
    expect(screen.getByRole('link', { name: /ID/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /EN/ }).hasAttribute('aria-current')).toBe(false);
  });

  it('exposes an accessible group label', () => {
    render(<LanguageSwitch locale="en" label="Language" />);
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
  });
});
