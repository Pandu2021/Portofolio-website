/**
 * @file About.tsx
 * Short professional summary (two paragraphs, keyword-rich text).
 */
import type { SiteContent } from '@portfolio/content';
import { Section } from './Section';

/** Renders the About section. */
export function About({ content }: { content: SiteContent }) {
  const { about } = content;
  return (
    <Section id="about" title={about.title} intro={about.intro}>
      <div className="about" data-reveal>
        {about.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </Section>
  );
}
