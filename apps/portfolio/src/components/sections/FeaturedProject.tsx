/**
 * @file FeaturedProject.tsx
 * The main professional project. The client stays anonymous and no
 * screenshots are shown, as stated in the confidentiality note.
 */
import type { SiteContent } from '@portfolio/content';
import { Icon } from '@/components/ui/Icon';
import { Section } from './Section';

/** Renders the featured project case study. */
export function FeaturedProject({ content }: { content: SiteContent }) {
  const project = content.featuredProject;
  return (
    <Section id="projects" title={project.title} intro={project.intro} alt>
      <article className="card card--spotlight feature" data-reveal>
        <div className="feature__head">
          <h3 className="feature__name">{project.name}</h3>
          <p className="feature__meta">
            <span>{project.context}</span>
            <span aria-hidden="true">·</span>
            <span>{project.role}</span>
            <span aria-hidden="true">·</span>
            <span>{project.period}</span>
          </p>
        </div>
        <p className="feature__summary">{project.summary}</p>
        {/* Optional detail bullets (the public version keeps only the summary). */}
        {project.bullets.length > 0 && (
          <ul className="check-list">
            {project.bullets.map((bullet) => (
              <li key={bullet}>
                <Icon name="check" size={18} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
        <ul className="chips">
          {project.stack.map((tech) => (
            <li key={tech} className="chip">
              {tech}
            </li>
          ))}
        </ul>
        <p className="note">
          <Icon name="lock" size={16} />
          {project.confidentialityNote}
        </p>
      </article>
    </Section>
  );
}
