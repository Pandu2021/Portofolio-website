/**
 * @file site-apps.mjs
 * Single registry of the apps that make up the published GitHub Pages site.
 *
 * To publish a new framework app, add ONE entry here (see docs/ADDING-A-FRAMEWORK.md).
 * `scripts/assemble-site.mjs` copies each `from` folder into `_site/<to>/`.
 */

/**
 * @typedef {object} SiteApp
 * @property {string} id    Workspace folder name in `apps/`.
 * @property {string} from  Build output folder, relative to the repository root.
 * @property {string} to    Sub-path inside `_site/` ('' = site root). Must match
 *                          the `path` in packages/content/src/data/showcase.json.
 */

/** @type {readonly SiteApp[]} */
export const SITE_APPS = Object.freeze([
  { id: 'portfolio', from: 'apps/portfolio/out', to: '' },
  { id: 'react-storefront', from: 'apps/react-storefront/dist', to: 'react' },
  { id: 'angular-dashboard', from: 'apps/angular-dashboard/dist', to: 'angular' },
]);

/** GitHub Pages project path (repository name). */
export const PAGES_BASE_PATH = '/Portofolio-website';

/** Output folder uploaded to GitHub Pages. */
export const SITE_DIR = '_site';
