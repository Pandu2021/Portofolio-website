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

- A tiny inline boot script in `<head>` applies the stored theme before the first paint (no flash) and marks
  `<html class="js">`, which enables the scroll-reveal animation only when JavaScript runs.

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
scripts/assemble-site.mjs (Phase 3)
  → _site/              (portfolio)
  → _site/react/        (storefront)
  → _site/angular/      (dashboard)
GitHub Actions → actions/deploy-pages → GitHub Pages
```

- The portfolio uses `basePath: '/Portofolio-website'` and `trailingSlash: true`.
- After `next build`, `apps/portfolio/scripts/apply-csp.ts` adds a strict Content-Security-Policy `<meta>` to every
  exported HTML file. Each inline script (Next.js page data, the theme boot script, JSON-LD) is allowed by its SHA-256
  hash; `unsafe-inline` is never used, and the step fails the build if an inline `style` attribute appears.
- Demos use **relative** asset URLs (`base: './'` in Vite, `baseHref: "./"` in Angular), so they work under any path.

## Dependency policy

- Versions shared by several packages are pinned once in the **pnpm catalog** (`pnpm-workspace.yaml`).
- TypeScript is pinned to **6.0.x** (Angular 22 and typescript-eslint require `< 6.1`).
- ESLint is pinned to **9.x** (the plugins inside `eslint-config-next` do not support ESLint 10 yet).
- Install scripts of dependencies are blocked (`allowBuilds`), and versions younger than 24 h are ignored (`minimumReleaseAge`).

## Decisions

Architecture Decision Records live in [docs/adr/](adr/).
