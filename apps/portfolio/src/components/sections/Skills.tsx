/**
 * @file Skills.tsx
 * Skills as plain-text chips grouped by area — no progress bars, because a
 * "80 % React" bar says nothing measurable and hides keywords from parsers.
 */
import type { SiteContent } from '@portfolio/content';
import { Section } from './Section';

/** Renders the Skills section. */
export function Skills({ content }: { content: SiteContent }) {
  const { skills } = content;
  return (
    <Section id="skills" title={skills.title} intro={skills.intro} alt>
      <div className="skills-grid">
        {skills.groups.map((group) => (
          <div key={group.name} className="card skill-group" data-reveal>
            <h3 className="skill-group__name">{group.name}</h3>
            <ul className="chips">
              {group.items.map((item) => (
                <li key={item} className="chip">
                  {item}
                </li>
              ))}
            </ul>
            {group.note && <p className="skill-group__note">{group.note}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}
