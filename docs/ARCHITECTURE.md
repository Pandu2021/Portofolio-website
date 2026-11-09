# Architecture

## Goals

1. **One link** for recruiters: `https://pandu2021.github.io/Portofolio-website/` (printed on the CV — never rename the repository).
2. **Show several front-end frameworks fairly**: each framework owns **one complete app** (no micro-frontends mixing frameworks on one page).
3. **ATS- and SEO-friendly**: the main page is pre-rendered static HTML with real text, correct `lang`, headings and structured data.
4. **Private and secure by default**: no secrets, no private contact data, no third-party CDNs.

## System overview

```
                         GitHub Pages (static hosting)
           https://pandu2021.github.io/Portofolio-website/
 ┌──────────────────────────────┬──────────────────────┬─────────────────────────┐
 │ /  and  /id/                 │ /react/              │ /angular/               │
 │ apps/portfolio               │ apps/react-storefront│ apps/angular-dashboard  │
 │ Next.js static export (SSG)  │ Vite SPA, hash router│ Angular SPA, hash router│
 └──────────────┬───────────────┴──────────┬───────────┴────────────┬────────────┘
                │ imports                  │ imports                │ imports
        ┌───────▼────────┐        ┌────────▼─────────────────────────▼───┐
        │ packages/content│        │ packages/design-tokens               │
        │ EN/ID JSON,     │        │ tokens.css (light/dark), fonts, base │
        │ showcase.json   │        └──────────────────────────────────────┘
        └─────────────────┘        packages/config: ESLint, Prettier, tsconfig
                                   packages/security: apply-csp (strict CSP for every build)
```

## Page model

| App                  | Model                                        | Why                                                                                   |
| -------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Portfolio            | **One-page** site, pre-rendered per language | Fast to scan in 30 s; full text in HTML for ATS, search engines and screen readers.   |
| React / Angular demo | **SPA** with **hash routing** (`#/orders`)   | GitHub Pages has one global 404 page and no rewrites; hash URLs never 404 on refresh. |

## Internationalization (EN / ID)

- English at `/`, Indonesian at `/id/`. Both are fully static HTML.
- Implemented with **two root layouts** via route groups: `app/(en)/layout.tsx` and `app/(id)/layout.tsx`,
  so each HTML file has the correct `<html lang>`.
- `hreflang` alternates and canonical URLs are generated in `apps/portfolio/src/lib/metadata.ts`.
- All text comes from `packages/content/src/data/{en,id}.json`; a unit test fails if the two files differ in structure.
- A global 404 page (`global-not-found.tsx`) serves both languages.

## Theming (light / dark)

- Theme logic lives once in `packages/design-tokens/src/theme.ts` and is shared by every app. Because all apps are
  served from the same origin, a visitor's light/dark choice follows them from the portfolio into the demos.
- A tiny inline boot script in `<head>` applies the stored theme before the first paint (no flash) and marks
  `<html class="js">`, which enables the scroll-reveal animation only when JavaScript runs. Next.js renders it in the
  root layout; Vite injects it with a small `transformIndexHtml` plugin.

- Every color is defined once in `packages/design-tokens/src/tokens.css` using CSS `light-dark()`.
- Default follows the operating system (`color-scheme: light dark`); the theme toggle sets `data-theme="light|dark"` on `<html>`.
- Palette — light: cream `#FFF8F1`, ink `#0F172A`, orange `#C2410C`, teal `#0F766E`;
  dark: `#0B1220`, `#E2E8F0`, `#FB923C`, `#2DD4BF`. All text pairs pass WCAG 2.2 AA (≥ 4.5:1).
- Motion tokens drop to `0ms` when the visitor prefers reduced motion.

## Build & deploy

```
pnpm build
  ├─ apps/portfolio          → apps/portfolio/out/
  ├─ apps/react-storefront   → apps/react-storefront/dist/
  └─ apps/angular-dashboard  → apps/angular-dashboard/dist/
pnpm assemble  (scripts/assemble-site.mjs, app list in scripts/site-apps.mjs)
  → _site/              (portfolio)
  → _site/react/        (storefront)
  → _site/angular/      (dashboard)
  → _site/.nojekyll
GitHub Actions → actions/deploy-pages → GitHub Pages
```

| Workflow                       | Trigger                                                        | What it does                                                                                              |
| ------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | pull requests, pushes to non-`main` branches, called by deploy | format, lint, typecheck, tests, `pnpm audit` (high), build + assemble, gitleaks over the **full history** |
| `.github/workflows/deploy.yml` | push to `main`, manual                                         | runs `ci.yml` (uploading `_site/`), then deploys to GitHub Pages only if every check passed               |
| `.github/dependabot.yml`       | weekly                                                         | grouped npm and GitHub Actions updates with a 3-day cooldown                                              |

### URLs in development vs. production

| Command                           | URL                                               | Base path                                       |
| --------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `pnpm dev`                        | http://localhost:3000/ (+ `/react/`, `/angular/`) | none (fast local work)                          |
| `pnpm build:site && pnpm preview` | http://localhost:4173/Portofolio-website/         | `/Portofolio-website` — identical to production |
| Live                              | https://pandu2021.github.io/Portofolio-website/   | `/Portofolio-website`                           |

`pnpm dev` runs `scripts/dev-gateway.mjs`: it starts each app's own dev server on an internal port (from
`scripts/site-apps.mjs`) and a small reverse proxy on port 3000 that also forwards WebSocket upgrades, so hot
reload works for every framework. Running only `next dev` would answer `/react/` with a 404, because the demos are
separate apps.

A GitHub **project site** always lives under `/<repository-name>/`. The domain root
`https://pandu2021.github.io/` belongs to a separate _user site_ repository (`Pandu2021.github.io`).

- The portfolio uses `basePath: '/Portofolio-website'` in production builds (none in `next dev`) and `trailingSlash: true`.
- After every app build, the shared `apply-csp` command (`packages/security`) adds a strict Content-Security-Policy
  `<meta>` to every HTML file. Each inline script (Next.js page data, the theme boot script, JSON-LD) is allowed by its
  SHA-256 hash; `unsafe-inline` is never used, and the build fails if an inline `style` attribute or an inline event
  handler (`onload="…"`) appears.
- Demos use **relative** asset URLs (`base: './'` in Vite, `baseHref: "./"` in Angular), so they work under any path.

### Angular-specific rules

- **No component `styles`**: Angular injects component CSS as runtime `<style>` tags, which the strict CSP
  (`style-src 'self'`) blocks. All dashboard styles live in `src/styles/dashboard.css` (an external file).
- `optimization.styles.inlineCritical: false`: critical-CSS inlining adds `onload="…"` handlers, which the CSP
  forbids (and `apply-csp` rejects).
- The theme boot script is copied into `src/index.html`; `scripts/boot-script.test.mjs` fails if it drifts from
  `packages/design-tokens/src/theme.ts`.
- `tsconfig.json` maps `@portfolio/design-tokens/theme` to its source file with `paths`, so the Angular dev server
  compiles it as app code instead of serving raw TypeScript from the workspace package.
- Subresource Integrity is on; Angular adds an inline integrity import map, which `apply-csp` hashes like any
  other inline script.

## Dependency policy

- Versions shared by several packages are pinned once in the **pnpm catalog** (`pnpm-workspace.yaml`).
- TypeScript is pinned to **6.0.x** (Angular 22 and typescript-eslint require `< 6.1`).
- ESLint is pinned to **9.x** (the plugins inside `eslint-config-next` do not support ESLint 10 yet).
- Install scripts of dependencies are blocked (`allowBuilds`), and versions younger than 24 h are ignored (`minimumReleaseAge`).

## Decisions

Architecture Decision Records live in [docs/adr/](adr/).
