/**
 * @file Experience.tsx
 * Work experience as a simple timeline (mirrors the CV wording for ATS).
 */
import type { SiteContent } from '@portfolio/content';
import { Section } from './Section';

/** Renders the Experience section. */
export function Experience({ content }: { content: SiteContent }) {
  const { experience } = content;
  return (
    <Section id="experience" title={experience.title} intro={experience.intro}>
      <ol className="timeline">
        {experience.items.map((item) => (
          <li key={item.role + item.period} className="timeline__item" data-reveal>
            <article className="card">
              <div className="timeline__head">
                <h3 className="timeline__role">{item.role}</h3>
                <p className="timeline__period">{item.period}</p>
              </div>
              <p className="timeline__org">
                {item.organization} · {item.location}
              </p>
              <ul className="bullet-list">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </Section>
  );
}
