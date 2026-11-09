/**
 * @file site-apps.mjs
 * Single registry of the apps that make up the site — used both for
 * publishing and for local development.
 *
 * To add a framework app, add ONE entry here (see docs/ADDING-A-FRAMEWORK.md):
 *  - `scripts/assemble-site.mjs` copies each `from` folder into `_site/<to>/`;
 *  - `scripts/dev-gateway.mjs` starts each app's dev server and serves it at
 *    http://localhost:3000/<to>/ — the same URL layout as the live site.
 */

/**
 * @typedef {object} DevServer
 * @property {number}   port    Internal port of the app's own dev server.
 * @property {string}   package Workspace package name (for `pnpm --filter`).
 * @property {string[]} args    Script name plus extra CLI arguments.
 */

/**
 * @typedef {object} SiteApp
 * @property {string}    id    Workspace folder name in `apps/`.
 * @property {string}    from  Build output folder, relative to the repository root.
 * @property {string}    to    Sub-path inside `_site/` ('' = site root). Must match
 *                             the `path` in packages/content/src/data/showcase.json.
 * @property {DevServer} dev   How to run it behind the dev gateway.
 */

/** @type {readonly SiteApp[]} */
export const SITE_APPS = Object.freeze([
  {
    id: 'portfolio',
    from: 'apps/portfolio/out',
    to: '',
    dev: { port: 3001, package: '@portfolio/web', args: ['dev', '--port', '3001'] },
  },
  {
    id: 'react-storefront',
    from: 'apps/react-storefront/dist',
    to: 'react',
    dev: {
      port: 5173,
      package: '@portfolio/react-storefront',
      args: ['dev', '--port', '5173', '--strictPort'],
    },
  },
  {
    id: 'angular-dashboard',
    from: 'apps/angular-dashboard/dist',
    to: 'angular',
    dev: {
      port: 4200,
      package: '@portfolio/angular-dashboard',
      args: ['start', '--port', '4200', '--serve-path', '/angular/'],
    },
  },
]);

/** GitHub Pages project path (repository name). */
export const PAGES_BASE_PATH = '/Portofolio-website';

/** Output folder uploaded to GitHub Pages. */
export const SITE_DIR = '_site';

/** Port of the local dev gateway (`pnpm dev`). */
export const DEV_GATEWAY_PORT = 3000;
