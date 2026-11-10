# Pandu Wicaksono — Portfolio

**Full-Stack Developer · E-commerce & Business Systems** — front-end focus on React, Next.js, Angular and TypeScript.

🌐 **Live:** <https://pandu2021.github.io/Portofolio-website/> (English) · [`/id/`](https://pandu2021.github.io/Portofolio-website/id/) (Bahasa Indonesia)

One repository, one GitHub Pages link, **one complete app per front-end framework**:

| URL path    | App                                              | Stack                                         |
| ----------- | ------------------------------------------------ | --------------------------------------------- |
| `/`, `/id/` | [apps/portfolio](apps/portfolio)                 | Next.js (static export), React, TypeScript    |
| `/react/`   | [apps/react-storefront](apps/react-storefront)   | React, Vite, React Router, Vitest             |
| `/angular/` | [apps/angular-dashboard](apps/angular-dashboard) | Angular (standalone, zoneless, Signals), RxJS |
| `/vue/`     | [apps/vue-invoice](apps/vue-invoice)             | Vue 3, Pinia, Vue Router, Vitest              |

## Repository layout

```
apps/
  portfolio/            Next.js main site (EN + ID)            → /
  react-storefront/     React + Vite demo                      → /react/
  angular-dashboard/    Angular demo                           → /angular/
  vue-invoice/          Vue 3 + Pinia invoice & pricing demo   → /vue/
packages/
  content/              Bilingual content (JSON) + Tech Lab registry + privacy tests
  design-tokens/        Colors (light/dark), type, spacing, motion, self-hosted fonts
  config/               Shared ESLint, Prettier and tsconfig
  security/             apply-csp: strict Content-Security-Policy for every static build
docs/                   Architecture, how to add a framework, ADRs
scripts/                Dev gateway, site assembly/preview, E2E tests, Lighthouse, link checker
.githooks/              pre-commit secret & privacy scan (gitleaks)
.github/workflows/      ci.yml (quality gate) and deploy.yml (GitHub Pages)
```

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/ADDING-A-FRAMEWORK.md](docs/ADDING-A-FRAMEWORK.md) · [docs/adr/](docs/adr/)

## Quick start

Requirements: **Node.js 24** (see `.nvmrc`), **pnpm 12**, optional [gitleaks](https://github.com/gitleaks/gitleaks) for local secret scanning.

```bash
pnpm install          # installs everything and enables the pre-commit hook
pnpm dev              # every app behind one URL (same layout as the live site):
                      #   http://localhost:3000/          portfolio (EN), /id/ (ID)
                      #   http://localhost:3000/react/    React storefront
                      #   http://localhost:3000/angular/  Angular dashboard
                      #   http://localhost:3000/vue/      Vue invoice tool
pnpm dev -- --only=react-storefront   # gateway + selected apps only
pnpm dev:portfolio    # Next.js alone at http://localhost:3000/ (no demos)
```

| Command                    | What it does                                                             |
| -------------------------- | ------------------------------------------------------------------------ |
| `pnpm build`               | Builds every app in `apps/`                                              |
| `pnpm build:site`          | Builds every app and assembles `_site/`                                  |
| `pnpm preview`             | Serves `_site/` exactly like GitHub Pages                                |
| `pnpm lint`                | ESLint in every package                                                  |
| `pnpm typecheck`           | TypeScript strict checks in every package                                |
| `pnpm test`                | Unit tests (Vitest) in every package + tests of the repo scripts         |
| `pnpm e2e`                 | Browser tests of `_site/` (run `pnpm build:site` first)                  |
| `pnpm e2e:live`            | The same browser tests against the live site                             |
| `pnpm e2e:dev`             | Read-only checks of a running `pnpm dev` (gateway + hot reload)          |
| `pnpm lighthouse`          | Lighthouse (mobile + desktop) for every app; reports `.lighthouseci/`    |
| `pnpm lighthouse --runs=3` | Same, each page 3× and the **median** reported (stable on a busy laptop) |
| `pnpm pagespeed`           | Lighthouse of the live site on Google's servers (PageSpeed Insights)     |
| `pnpm links`               | Checks every internal link/anchor and every external link                |
| `pnpm format`              | Formats the repository with Prettier                                     |
| `pnpm secrets:scan`        | Scans the working tree with gitleaks                                     |

### URLs

| Where   | Command                           | URL                                                                                                                                                                                                                                                                                                                        |
| ------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev     | `pnpm dev`                        | http://localhost:3000/ · `/id/` · `/react/` · `/angular/` · `/vue/`                                                                                                                                                                                                                                                        |
| Preview | `pnpm build:site && pnpm preview` | http://localhost:4173/Portofolio-website/ (same paths as production)                                                                                                                                                                                                                                                       |
| Live    | push to `main` → Deploy workflow  | [portfolio](https://pandu2021.github.io/Portofolio-website/) · [ID](https://pandu2021.github.io/Portofolio-website/id/) · [react](https://pandu2021.github.io/Portofolio-website/react/) · [angular](https://pandu2021.github.io/Portofolio-website/angular/) · [vue](https://pandu2021.github.io/Portofolio-website/vue/) |

## Testing

| Level       | Tool                                                                            | Where                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest (jsdom), `node --test`                                                   | `apps/*/src/**/*.test.*`, `packages/*/src/**/*.test.*`, `scripts/*.test.mjs`                                                            |
| Browser E2E | puppeteer-core + installed Chrome/Edge (found automatically, or `BROWSER_PATH`) | [`scripts/e2e/`](scripts/e2e): one suite per app + a layout suite (375 px / 768 px overflow, keyboard focus is visible and not covered) |
| Lighthouse  | `lighthouse` (Node API)                                                         | [`scripts/lighthouse.mjs`](scripts/lighthouse.mjs), minimum score `LH_MIN` (default 90)                                                 |
| Links       | `fetch`, read-only                                                              | [`scripts/check-links.mjs`](scripts/check-links.mjs); sites that block bots (LinkedIn answers `999`) are listed as _check manually_     |

The E2E suites check, among other things: no console errors and **no CSP violations**, theme toggle and stored
theme, certificate dialog (Esc closes, focus returns), mobile menu, skip link, 404 page; the storefront cart,
promo code, checkout validation and confirmation; the dashboard login guard, filters, paging, live announcements,
settings validation and sign-out; the invoice tool totals (tax rate, rounding), validation, print view,
persistence, delete dialog and USD display. In CI the `e2e` job runs after `build` on the runner's Chrome, and Deploy waits
for it.

### Lighthouse scores

Accessibility, Best Practices and SEO are **100** on every page. Performance depends on the machine: on a busy
laptop it varies by ±20 points between identical runs, so compare **medians** (`pnpm lighthouse --runs=3`).
The reliable numbers are the ones from the CI job (clean runner, median of 3) — open a run → _Summary_ →
**Lighthouse** table, or download the `lighthouse-reports` artifact.

`pnpm lighthouse --runs=3` on `_site/` (Lighthouse 13, 2026-11-10, median of 3) — Performance / Accessibility / Best Practices / SEO:

| Page                          | Mobile                | Desktop               |
| ----------------------------- | --------------------- | --------------------- |
| Portfolio EN `/`              | 95 / 100 / 100 / 100  | 100 / 100 / 100 / 100 |
| Portfolio ID `/id/`           | 95 / 100 / 100 / 100  | 100 / 100 / 100 / 100 |
| React storefront `/react/`    | 99 / 100 / 100 / 100  | 100 / 100 / 100 / 100 |
| Angular dashboard `/angular/` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Vue invoice tool `/vue/`      | 99 / 100 / 100 / 100  | 100 / 100 / 100 / 100 |

## Quality & security

- TypeScript `strict` everywhere, ESLint + Prettier, unit tests per package.
- Content is checked by tests: English and Indonesian must have the same structure, and **no e-mail, phone or ID-like numbers** may appear in content files.
- Secrets and private data are blocked by a **pre-commit hook** and a **CI secret scan** (gitleaks with custom privacy rules).
- Strict Content-Security-Policy on every page (script hashes, no `unsafe-inline`); no source maps are published.
- No third-party CDNs: fonts and scripts are served from this site. See [SECURITY.md](SECURITY.md).
- Accessibility target **WCAG 2.2 AA**: semantic HTML, skip links, visible focus, AA contrast in both themes,
  reduced-motion support — checked by Lighthouse and the keyboard/layout E2E suite.

## License

© Pandu Wicaksono. All rights reserved. The source is public so recruiters and reviewers can read it;
please ask before reusing the content, design or personal information.
