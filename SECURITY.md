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

| Layer           | Control                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Before commit   | `.githooks/pre-commit`: gitleaks + fallback scanner (secrets, private file names, phone numbers)             |
| Repository      | `.gitignore` blocks private documents, env files, keys and build output                                      |
| Content         | Unit tests reject e-mail addresses, phone numbers and ID-like numbers in content files                       |
| CI              | gitleaks scan of the full history on every push and pull request                                             |
| Dependencies    | Pinned versions (pnpm catalog), install scripts blocked, 24 h minimum release age                            |
| GitHub Actions  | Least-privilege `permissions`, third-party actions pinned to commit SHAs                                     |
| Browser         | No third-party CDNs; self-hosted fonts; Subresource Integrity on Angular bundles; CSP via `<meta>` (Phase 2) |
| Commit metadata | Commits use the GitHub `noreply` e-mail address                                                              |

## Recommended GitHub settings

- Secret scanning + **push protection**: on
- Dependabot alerts and security updates: on
- Branch protection on `main`: require pull request and passing checks
- Settings → Emails: _Keep my email addresses private_ and _Block command line pushes that expose my email_
