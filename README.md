# Pandu Wicaksono — Portfolio

**Full-Stack Developer · E-commerce & Business Systems** — front-end focus on React, Next.js, Angular and TypeScript.

🌐 **Live:** <https://pandu2021.github.io/Portofolio-website/> (English) · [`/id/`](https://pandu2021.github.io/Portofolio-website/id/) (Bahasa Indonesia)

One repository, one GitHub Pages link, **one complete app per front-end framework**:

| URL path    | App                                              | Stack                                         |
| ----------- | ------------------------------------------------ | --------------------------------------------- |
| `/`, `/id/` | [apps/portfolio](apps/portfolio)                 | Next.js (static export), React, TypeScript    |
| `/react/`   | [apps/react-storefront](apps/react-storefront)   | React, Vite, React Router, Vitest             |
| `/angular/` | [apps/angular-dashboard](apps/angular-dashboard) | Angular (standalone, zoneless, Signals), RxJS |

## Repository layout

```
apps/
  portfolio/            Next.js main site (EN + ID)            → /
  react-storefront/     React + Vite demo                      → /react/
  angular-dashboard/    Angular demo                           → /angular/
packages/
  content/              Bilingual content (JSON) + Tech Lab registry + privacy tests
  design-tokens/        Colors (light/dark), type, spacing, motion, self-hosted fonts
  config/               Shared ESLint, Prettier and tsconfig
  security/             apply-csp: strict Content-Security-Policy for every static build
docs/                   Architecture, how to add a framework, ADRs
scripts/                Repository tooling (git hook setup)
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
pnpm dev -- --only=react-storefront   # gateway + selected apps only
pnpm dev:portfolio    # Next.js alone at http://localhost:3000/ (no demos)
```

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `pnpm build`        | Builds every app in `apps/`               |
| `pnpm build:site`   | Builds every app and assembles `_site/`   |
| `pnpm preview`      | Serves `_site/` exactly like GitHub Pages |
| `pnpm lint`         | ESLint in every package                   |
| `pnpm typecheck`    | TypeScript strict checks in every package |
| `pnpm test`         | Unit tests (Vitest) in every package      |
| `pnpm format`       | Formats the repository with Prettier      |
| `pnpm secrets:scan` | Scans the working tree with gitleaks      |

## Quality & security

- TypeScript `strict` everywhere, ESLint + Prettier, unit tests per package.
- Content is checked by tests: English and Indonesian must have the same structure, and **no e-mail, phone or ID-like numbers** may appear in content files.
- Secrets and private data are blocked by a **pre-commit hook** and a **CI secret scan** (gitleaks with custom privacy rules).
- No third-party CDNs: fonts and scripts are served from this site. See [SECURITY.md](SECURITY.md).

## License

© Pandu Wicaksono. All rights reserved. The source is public so recruiters and reviewers can read it;
please ask before reusing the content, design or personal information.
