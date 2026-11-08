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

| Certificate | Issuer | Date | Type | ID |
|---|---|---|---|---|
| Google Data Analytics | Google | 2026-11-04 | professional-cert | 5NTXDWDTS3GC |
| Developing iOS Apps with Swift | IBM & SkillUp | 2026-08-29 | specialization | 42Y70WC1MYG1 |
| Microsoft Full-Stack Developer | Microsoft | 2026-08-19 | professional-cert | LETMGCJEDKZ5 |
| Google Advanced Data Analytics | Google | 2026-06-01 | professional-cert | HQXEI1E5QVXK |
| Amazon Junior Software Developer | Amazon | 2025-08-01 | professional-cert | 6JD47YHV3NUB |
| IBM Full Stack Software Developer | IBM | 2025-07-24 | professional-cert | 10G55LPP9IPQ |
| Google Cybersecurity | Google | 2025-06-26 | professional-cert | J1IVP9N9DTY8 |
| Google UX Design | Google | 2025-06-26 | professional-cert | OZCGCY40KSAS |
| Google Digital Marketing & E-commerce | Google | 2025-06-26 | professional-cert | LZW4EHP26GUL |
| Google Business Intelligence | Google | 2025-06-25 | professional-cert | A6HI34IB1S4U |
| Capital Market School 2020 (participant) | Investor Club UKSW with IDX, KSEI, KPEI | 2020-07-21 | image only | – |

Certificate images live in `apps/portfolio/public/certificates/<slug>.jpg`
(trimmed, max 1600 px wide, progressive JPG q82, metadata stripped; ~130–170 KB each).
Slugs: google-data-analytics, ibm-skillup-ios-apps-swift, microsoft-full-stack-developer,
google-advanced-data-analytics, amazon-junior-software-developer, ibm-full-stack-software-developer,
google-cybersecurity, google-ux-design, google-digital-marketing-ecommerce,
google-business-intelligence, capital-market-school-2020.
Note: the capital-market certificate image shows the student ID next to the name — see open decision.

## Education

- Bachelor of Economics (S.E.), Management – Financial Management, Universitas Kristen Satya Wacana,
  Salatiga, Sep 2015 – Apr 2021.
