# Adding a new framework app

Every framework owns **one complete app** under `apps/` and is published as a sub-path of the
same GitHub Pages site. Example below: a Vue app served at `/vue/`.

## 1. Create the app

```bash
pnpm create vue@latest apps/vue-invoice     # or the framework's official generator
```

- Name the package `@portfolio/<app-name>` in its `package.json`.
- Use **relative asset URLs** (Vite: `base: './'`) so the build works under `/Portofolio-website/vue/`.
- Use **hash routing** (Vue Router: `createWebHashHistory()`), because GitHub Pages cannot rewrite deep links.
- Add a link back to the portfolio: `<a href="../">← Back to portfolio</a>`.

## 2. Reuse the shared packages

```jsonc
// apps/vue-invoice/package.json
"dependencies": { "@portfolio/design-tokens": "workspace:*" },
"devDependencies": { "@portfolio/config": "workspace:*", "typescript": "catalog:", "eslint": "catalog:", "vitest": "catalog:" }
```

```css
/* global stylesheet */
@import '@portfolio/design-tokens/tokens.css';
@import '@portfolio/design-tokens/fonts.css';
@import '@portfolio/design-tokens/base.css';
```

- `tsconfig.json` → `"extends": "@portfolio/config/tsconfig.base.json"`.
- `eslint.config.js` → spread `baseConfig` from `@portfolio/config/eslint`, then add the framework preset.
- Theme: inject `themeBootScript` from `@portfolio/design-tokens/theme` into `<head>` and use the shared
  `setThemePreference` / `subscribeTheme` helpers for the toggle.
- If the framework's dev server serves workspace packages as prebuilt dependencies (Angular does), map the
  TypeScript entry with `compilerOptions.paths` so it is compiled as app source.
- Security: add `@portfolio/security` as a dev dependency and run `apply-csp dist` after the framework build
  (e.g. `"build": "vite build && apply-csp dist"`). Avoid inline `style` attributes and inline event handlers.

## 3. Provide the standard scripts

Every app must expose the same script names so CI picks it up automatically:

| Script      | Purpose                                   |
| ----------- | ----------------------------------------- |
| `build`     | Production build into `dist/` (or `out/`) |
| `lint`      | ESLint                                    |
| `typecheck` | TypeScript without emitting               |
| `test`      | Unit tests, non-watch mode                |

## 4. Register it in the Tech Lab

Add (or update) one entry in [`packages/content/src/data/showcase.json`](../packages/content/src/data/showcase.json):

```json
{
  "id": "vue-invoice",
  "framework": "Vue",
  "brand": "vue",
  "path": "vue/",
  "sourcePath": "apps/vue-invoice",
  "status": "in-progress",
  "title": { "en": "Invoice & pricing tool", "id": "Alat invoice & harga" },
  "description": { "en": "…", "id": "…" },
  "stack": ["Vue 3", "Pinia", "TypeScript"]
}
```

The card appears on the portfolio automatically. If the framework needs a new badge color,
add `--brand-<name>` to `packages/design-tokens/src/tokens.css` (check ≥ 4.5:1 contrast in both themes)
and extend the `brand` union in `packages/content/src/types.ts`.

## 5. Publish it

Add **one entry** to [`scripts/site-apps.mjs`](../scripts/site-apps.mjs):

```js
{
  id: 'vue-invoice',
  from: 'apps/vue-invoice/dist',
  to: 'vue',
  // `pnpm dev` serves it at http://localhost:3000/vue/ (dev server base must be '/vue/')
  dev: { port: 5174, package: '@portfolio/vue-invoice', args: ['dev', '--port', '5174', '--strictPort'] },
},
```

`to` must match the `path` in `showcase.json` (`vue/`). `pnpm assemble` refuses to build the site if a
non-planned showcase app has no published folder, or if two apps would write to the same folder.

Check locally, then commit and open a pull request (CI runs on every pull request; merging to `main` deploys):

```bash
pnpm build:site   # build every app + assemble _site/
pnpm preview      # http://localhost:4173/Portofolio-website/vue/
pnpm test
```

## Checklist

- [ ] Relative asset base and hash routing
- [ ] Shared tokens and fonts imported (no CDN links)
- [ ] `build`, `lint`, `typecheck`, `test` scripts pass
- [ ] Mock data only — no real client data, keys or personal contact details
- [ ] Entry added to `showcase.json` and `scripts/site-apps.mjs`
