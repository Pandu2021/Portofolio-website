/**
 * @file site.ts
 * Site-wide constants and URL helpers (no React, safe to import anywhere,
 * including next.config.ts).
 */

/** GitHub Pages project path. Must match the repository name. */
export const BASE_PATH = '/Portofolio-website';

/** Public origin of the site. */
export const SITE_ORIGIN = 'https://pandu2021.github.io';

/** Absolute URL of the site root, with trailing slash. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}/`;

/** Public source repository. */
export const REPO_URL = 'https://github.com/Pandu2021/Portofolio-website';

/** One-page résumé in `public/`, and the friendly name used when downloading it. */
export const RESUME_FILE = 'Resume_Public.pdf';
export const RESUME_DOWNLOAD_NAME = 'Pandu-Wicaksono-Resume.pdf';

/** Two-page CV in `public/`, and its download name. */
export const CV_FILE = 'CV_Public.pdf';
export const CV_DOWNLOAD_NAME = 'Pandu-Wicaksono-CV.pdf';

/**
 * Link to a folder of this repository on GitHub.
 * @example repoTreeUrl('apps/portfolio')
 */
export function repoTreeUrl(path: string): string {
  return `${REPO_URL}/tree/main/${path}`;
}

/**
 * Prefixes a public-folder asset path with the base path.
 * Needed for plain `<a href>` / `<img src>` (Next.js `<Link>` adds it automatically).
 *
 * @param path - Path relative to `public/`, with or without a leading slash.
 * @example withBasePath('Resume_Public.pdf') // '/Portofolio-website/Resume_Public.pdf'
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}/${path.replace(/^\/+/, '')}`;
}

/**
 * Absolute public URL for a site-relative path.
 * @example absoluteUrl('/id/') // 'https://pandu2021.github.io/Portofolio-website/id/'
 */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${withBasePath(path)}`;
}
