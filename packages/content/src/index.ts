/**
 * @file index.ts
 * Public API of @portfolio/content — the single source of truth for website text.
 *
 * Raw JSON is validated here at module load, so a typo such as an unknown
 * showcase status fails the build instead of shipping a broken page.
 */
import certificationsRaw from './data/certifications.json';
import courseProjectsRaw from './data/course-projects.json';
import enRaw from './data/en.json';
import idRaw from './data/id.json';
import showcaseRaw from './data/showcase.json';
import type {
  Certification,
  CourseProject,
  CourseProjectStatus,
  Locale,
  ShowcaseApp,
  ShowcaseStatus,
  SiteContent,
} from './types';

export type * from './types';

/** All supported languages, default first. */
export const locales = ['en', 'id'] as const satisfies readonly Locale[];

/** Language served at the site root (`/`). */
export const defaultLocale: Locale = 'en';

/** BCP 47 tags used for `<html lang>`, `hreflang` and `Intl` formatting. */
export const localeTag: Record<Locale, string> = { en: 'en', id: 'id-ID' };

/** Human-readable language names for the language switcher. */
export const localeLabel: Record<Locale, string> = { en: 'English', id: 'Bahasa Indonesia' };

const SHOWCASE_STATUSES: readonly ShowcaseStatus[] = ['live', 'in-progress', 'planned'];
const SHOWCASE_BRANDS: readonly ShowcaseApp['brand'][] = ['next', 'react', 'angular', 'vue'];

/**
 * Narrows an unknown string to a {@link Locale}.
 * @param value - Any string, e.g. a route segment.
 */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Validates that a raw JSON value is one of the allowed literals.
 * @throws Error naming the offending field, so build logs are easy to read.
 */
function assertOneOf<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`[content] Invalid ${field}: "${value}". Allowed: ${allowed.join(', ')}`);
  }
  return value as T;
}

/** Builds a typed {@link SiteContent} from raw JSON and checks its locale. */
function toSiteContent(raw: typeof enRaw | typeof idRaw, expected: Locale): SiteContent {
  const locale = assertOneOf(raw.locale, locales, 'locale');
  if (locale !== expected) {
    throw new Error(`[content] data/${expected}.json declares locale "${locale}"`);
  }
  return { ...raw, locale };
}

const siteContent: Record<Locale, SiteContent> = {
  en: toSiteContent(enRaw, 'en'),
  id: toSiteContent(idRaw, 'id'),
};

/**
 * Returns all translated website text for one language.
 * @param locale - `en` (default) or `id`.
 */
export function getContent(locale: Locale): SiteContent {
  return siteContent[locale];
}

/**
 * Professional certificates, newest MONTH first (the site shows month + year).
 * Within the same month the order of certifications.json is kept, so it can
 * match the CV exactly; the real issue dates are never changed for this.
 */
export const certifications: readonly Certification[] = [...certificationsRaw].sort((a, b) =>
  b.date.slice(0, 7).localeCompare(a.date.slice(0, 7)),
);

/** Framework apps listed in the Tech Lab (registry — see docs/ADDING-A-FRAMEWORK.md). */
export const showcase: readonly ShowcaseApp[] = showcaseRaw.map((app) => ({
  ...app,
  brand: assertOneOf(app.brand, SHOWCASE_BRANDS, `showcase[${app.id}].brand`),
  status: assertOneOf(app.status, SHOWCASE_STATUSES, `showcase[${app.id}].status`),
}));

const COURSE_PROJECT_STATUSES: readonly CourseProjectStatus[] = ['completed', 'in-progress'];

/**
 * Hands-on projects from the certificate programs, in CV order.
 * A project must reference an existing certificate, or name its program
 * while the certificate is not earned yet.
 */
export const courseProjects: readonly CourseProject[] = courseProjectsRaw.map((project) => {
  const { certificationId, program } = project;
  if (certificationId !== null && !certifications.some((cert) => cert.id === certificationId)) {
    throw new Error(
      `[content] course project "${project.id}": unknown certificationId "${certificationId}"`,
    );
  }
  if ((certificationId === null) === (program === null)) {
    throw new Error(
      `[content] course project "${project.id}": set exactly one of certificationId or program`,
    );
  }
  return {
    ...project,
    status: assertOneOf(
      project.status,
      COURSE_PROJECT_STATUSES,
      `courseProjects[${project.id}].status`,
    ),
  };
});

/**
 * Normalizes a skill keyword for comparisons: case-insensitive and without a
 * trailing qualifier, so "Kotlin" and "Kotlin (Android)" count as one keyword.
 */
export function skillKey(keyword: string): string {
  return keyword
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
    .toLowerCase();
}

/**
 * Formats an ISO date (`YYYY-MM-DD`) as "Nov 2026" / "Nov 2026" for the given language.
 * Uses UTC so the month never shifts with the visitor's time zone.
 */
export function formatMonthYear(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag[locale], {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/**
 * Site-relative path of a language version (without the GitHub Pages base path).
 * @example localePath('en') // '/'
 * @example localePath('id') // '/id/'
 */
export function localePath(locale: Locale): string {
  return locale === defaultLocale ? '/' : `/${locale}/`;
}
