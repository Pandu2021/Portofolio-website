/**
 * @file About.tsx
 * Short professional summary (two paragraphs, keyword-rich text) and the
 * spoken languages with honest proficiency levels.
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
        <div className="languages">
          <h3 className="languages__title">{about.languages.title}</h3>
          <dl className="languages__list">
            {about.languages.items.map((language) => (
              <div key={language.code} className="languages__item">
                <dt>{language.name}</dt>
                <dd>{language.level}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
