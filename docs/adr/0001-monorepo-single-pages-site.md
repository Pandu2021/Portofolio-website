# ADR 0001 — One monorepo, one GitHub Pages site, one app per framework

- **Status:** Accepted
- **Date:** 2026-11-09
- **Decider:** Pandu Wicaksono

## Context

The portfolio must prove skills in several front-end frameworks that appear in job postings
(React/Next.js first, Angular second, Vue later). Recruiters spend under a minute per candidate,
and the portfolio URL `pandu2021.github.io/Portofolio-website` is already printed on the CV and resume.

Options considered:

1. **Multi-repo, multi-site** — one repository and one GitHub Pages URL per framework.
2. **Micro-frontends** — several frameworks rendered together on the same page.
3. **Monorepo, single site** — one repository, one URL, each framework owns one complete app under a sub-path.

## Decision

Option 3: a **pnpm workspace monorepo** deployed as **one GitHub Pages site**.

- `apps/portfolio` (Next.js static export) is the home page, in English (`/`) and Indonesian (`/id/`).
- Each framework demo is a complete SPA under its own path: `/react/`, `/angular/`, later `/vue/`.
- Shared content, design tokens and tooling live in `packages/`.
- The back-end will live in a **separate repository**, so this repository stays static and secret-free.

## Consequences

**Positive**

- A single link to share; the CV link keeps working.
- Consistent look and quality across frameworks (shared tokens, lint and TypeScript rules).
- One CI pipeline, one security setup, one place to update content.
- Shows monorepo and architecture skills in itself.

**Negative / trade-offs**

- One build deploys everything; a broken app blocks the deploy (mitigated by CI on every pull request).
- Framework toolchains have different version constraints (handled with the pnpm catalog; see ARCHITECTURE.md).
- Demo apps must use hash routing because GitHub Pages cannot rewrite deep links.

## Effort split (current phase)

React/Next.js **55 %** (main site + storefront demo) · Angular **45 %** (dashboard demo).
After Vue is added: React 45 % · Angular 35 % · Vue 20 %.
