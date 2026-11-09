/**
 * @file Education.tsx
 * Formal education (one line per degree).
 */
import type { SiteContent } from '@portfolio/content';
import { Section } from './Section';

/** Renders the Education section. */
export function Education({ content }: { content: SiteContent }) {
  const { education } = content;
  return (
    <Section id="education" title={education.title} intro={education.intro}>
      <ul className="edu-list">
        {education.items.map((item) => (
          <li key={item.degree} className="card edu-card" data-reveal>
            <h3 className="edu-card__degree">{item.degree}</h3>
            <p className="edu-card__meta">
              {item.school} · {item.location} · {item.period}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
