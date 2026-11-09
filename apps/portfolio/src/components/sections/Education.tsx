/**
 * @file Education.tsx
 * Formal education: degree, relevant coursework grouped by area, and academic
 * experience. Coursework lists course NAMES (facts from the transcript), not
 * skill keywords — skills live only in the Skills section.
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
            {item.coursework.length > 0 && (
              <div className="edu-card__coursework">
                <h4 className="edu-card__subtitle">{education.courseworkTitle}</h4>
                <dl className="coursework">
                  {item.coursework.map((group) => (
                    <div key={group.area} className="coursework__group">
                      <dt>{group.area}</dt>
                      <dd>{group.courses.join(', ')}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </li>
        ))}
        <li className="card edu-card" data-reveal>
          <h3 className="edu-card__degree">{education.activities.title}</h3>
          <ul className="activity-list">
            {education.activities.items.map((activity) => (
              <li key={activity.name}>
                <p className="activity-list__head">
                  <strong>{activity.name}</strong>
                  <span className="activity-list__period">{activity.period}</span>
                </p>
                <p className="activity-list__text">{activity.description}</p>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </Section>
  );
}
