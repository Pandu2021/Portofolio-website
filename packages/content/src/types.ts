/**
 * @file types.ts
 * Type definitions for all website content.
 *
 * Localized text lives in `data/en.json` and `data/id.json` (shape: {@link SiteContent}).
 * Locale-independent facts live in `data/certifications.json` and `data/showcase.json`.
 */

/** Supported website languages. English is the default (served at `/`). */
export type Locale = 'en' | 'id';

/** A value translated into every supported language. */
export type Localized<T = string> = Record<Locale, T>;

/** An external or internal link. */
export interface Link {
  label: string;
  href: string;
}

/** SEO metadata for one language version of the page. */
export interface MetaContent {
  title: string;
  description: string;
  /** Skill keywords for JSON-LD `knowsAbout` and ATS parsers. */
  keywords: string[];
}

/** Navigation labels; keys are the in-page section ids. */
export interface NavContent {
  about: string;
  projects: string;
  skills: string;
  experience: string;
  certifications: string;
  contact: string;
  resume: string;
}

export interface HeroContent {
  eyebrow: string;
  name: string;
  role: string;
  tagline: string;
  availability: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export interface Highlight {
  value: string;
  label: string;
}

export interface SectionIntro {
  title: string;
  intro?: string;
}

export interface FeaturedProject extends SectionIntro {
  name: string;
  context: string;
  role: string;
  period: string;
  summary: string;
  bullets: string[];
  stack: string[];
  confidentialityNote: string;
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface ExperienceItem {
  role: string;
  organization: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  location: string;
  period: string;
}

export interface ContactContent extends SectionIntro {
  body: string;
  links: Link[];
  resumeLabel: string;
  cvLabel: string;
}

/** Small UI strings (buttons, aria-labels, status words). */
export interface UiStrings {
  skipToContent: string;
  themeToggle: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  languageSwitch: string;
  openMenu: string;
  closeMenu: string;
  verify: string;
  viewCertificate: string;
  close: string;
  liveDemo: string;
  sourceCode: string;
  statusLive: string;
  statusInProgress: string;
  statusPlanned: string;
  backToTop: string;
  footerBuiltWith: string;
}

/** Everything that is translated, for one language. */
export interface SiteContent {
  locale: Locale;
  meta: MetaContent;
  nav: NavContent;
  hero: HeroContent;
  about: SectionIntro & { body: string[] };
  highlights: Highlight[];
  featuredProject: FeaturedProject;
  techLab: SectionIntro;
  skills: SectionIntro & { groups: SkillGroup[] };
  experience: SectionIntro & { items: ExperienceItem[] };
  certifications: SectionIntro;
  education: SectionIntro & { items: EducationItem[] };
  contact: ContactContent;
  ui: UiStrings;
}

/** One professional certificate (same in every language). */
export interface Certification {
  id: string;
  name: string;
  issuer: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  /** Official verification page, or `null` when the issuer has none. */
  verifyUrl: string | null;
  /** Image path relative to the portfolio's public folder. */
  image: string;
}

/** Release state of a showcase app. */
export type ShowcaseStatus = 'live' | 'in-progress' | 'planned';

/** One framework app in the Tech Lab (see docs/ADDING-A-FRAMEWORK.md). */
export interface ShowcaseApp {
  id: string;
  framework: string;
  /** Key of `frameworkColor` in @portfolio/design-tokens. */
  brand: 'next' | 'react' | 'angular' | 'vue';
  /** Path relative to the site root, e.g. `react/`. Empty string = home page. */
  path: string;
  /** Folder in this repository, e.g. `apps/react-storefront`. */
  sourcePath: string;
  status: ShowcaseStatus;
  title: Localized;
  description: Localized;
  stack: string[];
}
