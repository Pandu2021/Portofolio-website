# Security Policy

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through
[GitHub Security Advisories](https://github.com/Pandu2021/Portofolio-website/security/advisories/new)
or a LinkedIn message. You will get a reply within 7 days.

## Scope

This repository is a **static website** (no server, no database, no user accounts, no forms that store data).
Relevant issues include: leaked secrets or personal data, cross-site scripting through content,
vulnerable dependencies, and supply-chain risks in the build pipeline.

## What this repository never contains

- API keys, tokens, passwords, `.env` files or private keys
- Private personal data: phone/WhatsApp/LINE numbers, home address, ID-card or student-ID numbers, grades
- Client names, client data, payment-provider details or screenshots of client systems

## Controls in place

| Layer           | Control                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before commit   | `.githooks/pre-commit`: gitleaks + fallback scanner (secrets, private file names, phone numbers)                                                                                                                                                              |
| Repository      | `.gitignore` blocks private documents, env files, keys and build output                                                                                                                                                                                       |
| Content         | Unit tests reject e-mail addresses, phone numbers and ID-like numbers in content files                                                                                                                                                                        |
| CI              | gitleaks (checksum-verified binary) scans the full history on every push and pull request; deploy only after all checks pass                                                                                                                                  |
| Dependencies    | Pinned versions (pnpm catalog), install scripts blocked, 24 h minimum release age, `pnpm audit` in CI, Dependabot with 3-day cooldown                                                                                                                         |
| GitHub Actions  | Least-privilege `permissions`, third-party actions pinned to commit SHAs                                                                                                                                                                                      |
| Browser         | No third-party CDNs; self-hosted fonts; Subresource Integrity on Angular bundles; strict CSP `<meta>` with SHA-256 script hashes in every app (no `unsafe-inline`, shared `apply-csp` tool), `referrer` policy, `rel="noopener noreferrer"` on external links |
| Commit metadata | Commits use the GitHub `noreply` e-mail address                                                                                                                                                                                                               |
| Published files | Production builds emit **no source maps**; E2E tests fail on any CSP violation or console error on every page                                                                                                                                                 |

## Release checklist (run before publishing)

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
pnpm audit --audit-level high
pnpm build:site && pnpm e2e && pnpm links
gitleaks git . --config .gitleaks.toml --redact      # full history
gitleaks dir _site --config .gitleaks.toml --redact  # what will be published
```

Last full review: **2026-11-10** — gitleaks (history and `_site/`): no findings · `pnpm audit`: 0 high/critical ·
CSP `<meta>` present in all 7 HTML files · no `*.map` files or `sourceMappingURL` · no `console.log` in app code ·
no e-mail, phone, student-ID or client/payment-provider names in `_site/`.

### Known, accepted findings

| Finding                                                              | Why it is accepted                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimatch` 10.2.x — moderate ReDoS (GHSA "globparts amplification") | Only inside the **lint toolchain** (`eslint-config-next` → `typescript-eslint` → `typescript-estree`); it never runs in the browser or in the published site and only reads our own glob patterns. Fixed automatically when typescript-eslint updates (Dependabot). |

## GitHub settings to enable manually (repository owner)

These cannot be set from code. Tick them once:

- [ ] **Settings → Code security → Secret scanning**: on, with **Push protection** on
- [ ] **Settings → Code security → Dependabot alerts** and **Dependabot security updates**: on
- [ ] **Settings → Code security → Code scanning → CodeQL analysis → Set up → Default** (languages: JavaScript/TypeScript, Actions)
- [ ] **Settings → Code security → Private vulnerability reporting**: on (enables the "Report a vulnerability" link above)
- [ ] **Settings → Actions → General → Workflow permissions**: _Read repository contents and packages permissions_; leave _Allow GitHub Actions to create and approve pull requests_ **off**
- [ ] **Settings → Actions → General → Actions permissions**: allow only actions from GitHub and verified creators, and tick **Require actions to be pinned to a full-length commit SHA**
- [ ] **Settings → Rules → Rulesets → New branch ruleset** for `main`: restrict deletions, block force pushes, require status checks (`Format, lint, typecheck, test, audit`, `Build site`, `Browser E2E (Chrome)`, `Secret & privacy scan (full history)`)
- [ ] **Settings → Pages → Build and deployment → Source**: _GitHub Actions_ (already used by `deploy.yml`)
- [ ] **Settings → Environments → github-pages → Deployment branches**: only `main`
- [ ] Account **Settings → Emails**: _Keep my email addresses private_ and _Block command line pushes that expose my email_
- [ ] Account **Settings → Password and authentication**: two-factor authentication on (passkey or authenticator app)
