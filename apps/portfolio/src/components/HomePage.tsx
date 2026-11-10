/**
 * @file HomePage.tsx
 * The one-page portfolio for one language. Rendered to static HTML at build
 * time; only the small interactive pieces (menu, theme, dialogs, back-to-top,
 * scroll reveal with count-up, card spotlight) hydrate as client components.
 */
import { getContent, type Locale } from '@portfolio/content';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { About } from './sections/About';
import { Certifications } from './sections/Certifications';
import { Contact } from './sections/Contact';
import { Education } from './sections/Education';
import { Experience } from './sections/Experience';
import { FeaturedProject } from './sections/FeaturedProject';
import { Hero } from './sections/Hero';
import { Highlights } from './sections/Highlights';
import { Skills } from './sections/Skills';
import { TechLab } from './sections/TechLab';
import { JsonLd } from './seo/JsonLd';
import { BackToTop } from './ui/BackToTop';
import { RevealObserver } from './ui/RevealObserver';
import { Spotlight } from './ui/Spotlight';

/** Renders the complete home page in the given language. */
export function HomePage({ locale }: { locale: Locale }) {
  const content = getContent(locale);
  return (
    <>
      <a href="#main" className="skip-link">
        {content.ui.skipToContent}
      </a>
      <SiteHeader content={content} />
      <main id="main" tabIndex={-1}>
        <Hero content={content} />
        <Highlights content={content} />
        <About content={content} />
        <FeaturedProject content={content} />
        <TechLab content={content} />
        <Skills content={content} />
        <Experience content={content} />
        <Certifications content={content} />
        <Education content={content} />
        <Contact content={content} />
      </main>
      <SiteFooter content={content} />
      <BackToTop label={content.ui.backToTop} />
      <RevealObserver />
      <Spotlight />
      <JsonLd locale={locale} />
    </>
  );
}
