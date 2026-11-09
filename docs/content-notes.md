# Content Notes (sanitized source of truth)

> Purpose: distilled, **public-safe** facts used to write the website content
> (`packages/content`). Derived from `CV_Public.pdf`, `Resume_Public.pdf` and the
> author's private project summaries, which are **not** stored in this repository.
>
> Rules: no client/partner/brand names, no payment-provider names, no country or
> currency of the client, no contact numbers, no student ID, no grades.

## Identity

- Name: Pandu Wicaksono
- Headline: Full-Stack Developer | E-commerce & Business Systems (front-end focus on this site)
- Location: Indonesia (open to remote)
- Links: LinkedIn `linkedin.com/in/pandu-wicaksono-2b8430335`, GitHub `github.com/Pandu2021`,
  Kaggle `kaggle.com/panduwicaksono2025`
- Languages: Bahasa Indonesia (native), English (basic professional working proficiency)

## Featured project — Restaurant Ordering & Operations Platform (confidential client)

- Role: Freelance Full-Stack Developer, sole developer, 2025 – present, remote.
- Applications: customer web storefront (bilingual React SPA), B2B partner ordering portal,
  20-page role-protected admin console, NestJS REST API (~15 domain modules),
  Kotlin Android print agent, Windows print agent with installer.
- Highlights (approximate figures, counted from the codebase):
  - ~26 Prisma data models on PostgreSQL; ~45 pages in total (≈25 customer/partner + 20 admin).
  - ~95 automated test files (back-end, front-end, Android).
  - QR-code and card payments via a third-party gateway: webhooks, reconciliation, refunds with guardrails.
  - Configurable pricing engine: tax, service/card fees, promotions, distance-based delivery fee.
  - Real-time order tracking over Server-Sent Events (SSE); customer–admin live chat.
  - Print pipeline: server queue with claim → download → print → acknowledge, heartbeats, retries; ESC/POS and IPP.
  - Security: JWT access/refresh rotation, Argon2, OAuth 2.0, CSRF, CORS allowlist, Helmet/CSP,
    rate limiting, CAPTCHA, XSS sanitization, RBAC, audit logs, security-monitoring dashboard.
  - CI/CD: GitHub Actions with lint, type check, tests, dependency audit/review, CodeQL, Trivy, malware scan.
- Front-end stack: React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, React Hook Form,
  Zod, Tailwind CSS, Framer Motion, i18next, Vitest, Testing Library.
- Back-end stack: Node.js, NestJS, Prisma, PostgreSQL, SSE, Pino, PDFKit.
- Mobile/desktop: Kotlin, Android foreground service, Windows installer.

## Certifications (Coursera verify IDs; verify URL = `https://coursera.org/verify/<type>/<id>`)

| Certificate                              | Issuer                                  | Date       | Type              | ID           |
| ---------------------------------------- | --------------------------------------- | ---------- | ----------------- | ------------ |
| Google Data Analytics                    | Google                                  | 2026-11-04 | professional-cert | 5NTXDWDTS3GC |
| Developing iOS Apps with Swift           | IBM & SkillUp                           | 2026-08-29 | specialization    | 42Y70WC1MYG1 |
| Microsoft Full-Stack Developer           | Microsoft                               | 2026-08-19 | professional-cert | LETMGCJEDKZ5 |
| Google Advanced Data Analytics           | Google                                  | 2026-06-01 | professional-cert | HQXEI1E5QVXK |
| Amazon Junior Software Developer         | Amazon                                  | 2025-08-01 | professional-cert | 6JD47YHV3NUB |
| IBM Full Stack Software Developer        | IBM                                     | 2025-07-24 | professional-cert | 10G55LPP9IPQ |
| Google Cybersecurity                     | Google                                  | 2025-06-26 | professional-cert | J1IVP9N9DTY8 |
| Google UX Design                         | Google                                  | 2025-06-26 | professional-cert | OZCGCY40KSAS |
| Google Digital Marketing & E-commerce    | Google                                  | 2025-06-26 | professional-cert | LZW4EHP26GUL |
| Google Business Intelligence             | Google                                  | 2025-06-25 | professional-cert | A6HI34IB1S4U |
| Capital Market School 2020 (participant) | Investor Club UKSW with IDX, KSEI, KPEI | 2020-07-21 | image only        | –            |

Certificate images live in `apps/portfolio/public/certificates/<slug>.jpg`
(trimmed, max 1600 px wide, progressive JPG q82, metadata stripped; ~130–170 KB each).
Slugs: google-data-analytics, ibm-skillup-ios-apps-swift, microsoft-full-stack-developer,
google-advanced-data-analytics, amazon-junior-software-developer, ibm-full-stack-software-developer,
google-cybersecurity, google-ux-design, google-digital-marketing-ecommerce,
google-business-intelligence, capital-market-school-2020.
The capital-market certificate was rendered from the original PDF with the student ID **redacted**
(text removed, name re-centred); the original PDF is not stored in this repository.

## Education

- Bachelor of Economics (S.E.), Management – Financial Management, Universitas Kristen Satya Wacana,
  Salatiga, Sep 2015 – Apr 2021.
- Relevant coursework (from the CV): Finance – Financial Management, Advanced Financial Management,
  International Financial Management, Banking & Financial Institutions, Budgeting, Managerial Accounting,
  Risk Management · Analytics – Business Statistics, Decision-Making Analysis, Corporate Performance Analysis ·
  Business & Technology – Information Technology Applications, Project Management, Strategic Management,
  Marketing Management.
- Academic experience: E-Business Internship (Aug–Dec 2019), Business Plan Project (Jan–Apr 2019), event
  organizing committees (2018–2019). Event and village names are deliberately **not** published (they hint at
  a home location); the student leadership training is left out (low value for developer roles).

## Course projects

Eight hands-on projects from the certificate programs (CV section "Certification Projects"; Local Events
Explorer is intentionally left out) live in
`packages/content/src/data/course-projects.json`. Each one references its certificate by `certificationId`
(name, issuer and verify link come from `certifications.json`); only the unfinished Meta React Native program
has `certificationId: null`, a `program` name and `status: "in-progress"`. Links to the matching GitHub
repositories (e.g. Salifort-Motors-project-lab-, FullStackBlazorIntegration) are **not** added until those
repositories have been scanned with gitleaks.

## Keyword rule: one keyword, one home

Every skill keyword has exactly one place on the page, so recruiters and ATS parsers never see the same skill
twice under different spellings.

| Where                                  | Role                        | Rule                                                                                            |
| -------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Skills** (8 groups)                  | The one list of every skill | Each keyword once across all groups (case-insensitive; "Kotlin" = "Kotlin (Android)")           |
| Featured project, course projects      | Evidence                    | Chips only use Skills keywords; at most 5 chips per course project                              |
| Tech Lab                               | Demos in this repository    | Chips name techniques inside the demo code (e.g. "Signals", "useReducer"), exempt from the rule |
| Certifications                         | Proof                       | No skill lists; course projects link here by id                                                 |
| Education → coursework                 | Course names (facts)        | Written as on the transcript, not as skills                                                     |
| `meta.keywords` (JSON-LD `knowsAbout`) | Summary for search engines  | Short list (≈20) of the most important keywords                                                 |

`packages/content/src/content.test.ts` enforces the first two rows; `scripts/e2e/suites/portfolio.mjs`
checks the rendered page for duplicate skill chips.

AI tools are listed by **product name** only (GitHub Copilot, Claude Code, ChatGPT, Google Gemini,
Microsoft Copilot), never by model version: versions change every few months, and ATS searches for product
names. Apple Foundation Models is an AI feature the author **built** (iOS), so it belongs to the Mobile group,
not to the AI tools.
