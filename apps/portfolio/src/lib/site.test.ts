/**
 * @file site.test.ts
 * Unit tests for URL helpers — wrong base paths are the #1 cause of broken
 * links on GitHub Pages project sites.
 */
import { describe, expect, it } from 'vitest';
import { BASE_PATH, SITE_URL, absoluteUrl, withBasePath } from './site';

describe('site URL helpers', () => {
  it('base path matches the repository name', () => {
    expect(BASE_PATH).toBe('/Portofolio-website');
    expect(SITE_URL).toBe('https://pandu2021.github.io/Portofolio-website/');
  });

  it('withBasePath() handles leading slashes', () => {
    expect(withBasePath('Resume_Public.pdf')).toBe('/Portofolio-website/Resume_Public.pdf');
    expect(withBasePath('/certificates/a.jpg')).toBe('/Portofolio-website/certificates/a.jpg');
  });

  it('absoluteUrl() builds full public URLs', () => {
    expect(absoluteUrl('/id/')).toBe('https://pandu2021.github.io/Portofolio-website/id/');
    expect(absoluteUrl('/')).toBe('https://pandu2021.github.io/Portofolio-website/');
  });
});
