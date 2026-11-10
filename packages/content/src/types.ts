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
  /** Label of the header download button (two-page CV). */
  cv: string;
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

/**
 * One group of the Skills section.
 *
 * Rule "one keyword, one home": every keyword appears in exactly ONE group
 * (checked case-insensitively by content.test.ts). Project chips may only use
 * keywords that exist here, so a recruiter never reads two spellings of the
 * same skill.
 */
export interface SkillGroup {
  name: string;
  items: string[];
  /** Optional sentence shown under the chips (e.g. how AI tools are used). */
  note?: string;
  /** Highlighted group: a soft light travels around its border (portfolio motion). */
  accent?: boolean;
}

/** A spoken language and the honest proficiency level from the CV. */
export interface SpokenLanguage {
  /** BCP 47 code, used for JSON-LD `knowsLanguage`. */
  code: string;
  name: string;
  level: string;
}

/** A course or academic activity in the Education section. */
export interface CourseworkArea {
  area: string;
  courses: string[];
}

export interface AcademicActivity {
  name: string;
  period: string;
  description: string;
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
  /** Relevant courses, grouped by area (course names, not skill keywords). */
  coursework: CourseworkArea[];
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
  /** aria-label of the primary `<nav>`. */
  mainNav: string;
  /** aria-label of the highlights section (it has no visible heading). */
  highlightsLabel: string;
  /** Shown on the Tech Lab card of the page the visitor is on. */
  youAreHere: string;
  /** Screen-reader hint appended to links that open a new tab. */
  opensInNewTab: string;
  /** Prefix of the certificate dialog title, e.g. "Certificate:". */
  certificateOf: string;
  issuedBy: string;
}

/** Everything that is translated, for one language. */
export interface SiteContent {
  locale: Locale;
  meta: MetaContent;
  nav: NavContent;
  hero: HeroContent;
  about: SectionIntro & {
    body: string[];
    languages: { title: string; items: SpokenLanguage[] };
  };
  highlights: Highlight[];
  featuredProject: FeaturedProject;
  techLab: SectionIntro;
  /** Heading and intro of the course-project list (items: data/course-projects.json). */
  courseProjects: SectionIntro;
  skills: SectionIntro & { groups: SkillGroup[] };
  experience: SectionIntro & { items: ExperienceItem[] };
  certifications: SectionIntro;
  education: SectionIntro & {
    items: EducationItem[];
    courseworkTitle: string;
    activities: { title: string; items: AcademicActivity[] };
  };
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
  /** Intrinsic image size in pixels (prevents layout shift). */
  width: number;
  height: number;
}

/** State of a course project. */
export type CourseProjectStatus = 'completed' | 'in-progress';

/**
 * A hands-on project from a certificate program (data/course-projects.json).
 * The certificate itself is referenced by id — its name, issuer and verify
 * link come from certifications.json, so nothing is written twice.
 */
export interface CourseProject {
  id: string;
  title: Localized;
  /** Id in certifications.json, or `null` while the program is unfinished. */
  certificationId: string | null;
  /** Program name, only when there is no certificate yet (`certificationId: null`). */
  program: string | null;
  /** Single course inside a multi-course certificate, if the project belongs to one. */
  course: string | null;
  year: string;
  status: CourseProjectStatus;
  summary: Localized;
  /** Up to 5 chips; each must be a keyword from the Skills section. */
  stack: string[];
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
