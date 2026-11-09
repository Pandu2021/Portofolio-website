/**
 * @file CourseProjects.tsx
 * Hands-on projects from the certificate programs, shown as a sub-section of
 * the Tech Lab (H3 heading, H4 per project).
 *
 * Certificate name, year and verify link are looked up from certifications.json
 * by id, so the certificate list is never written twice ("one keyword, one home").
 */
import { certifications, courseProjects, type SiteContent } from '@portfolio/content';
import { ExternalLink } from '@/components/ui/ExternalLink';

/** Renders the course-project list. */
export function CourseProjects({ content }: { content: SiteContent }) {
  const { courseProjects: section, ui, locale } = content;
  return (
    <div className="course-projects">
      <div className="course-projects__head" data-reveal>
        <h3 id="course-projects-title" className="course-projects__title">
          {section.title}
        </h3>
        {section.intro && <p className="section__intro">{section.intro}</p>}
      </div>
      <ul className="course-grid" aria-labelledby="course-projects-title">
        {courseProjects.map((project) => {
          const cert = certifications.find((c) => c.id === project.certificationId);
          const source = cert?.name ?? project.program;
          const title = project.title[locale];
          return (
            <li key={project.id} className="card course-card" data-reveal>
              <div className="course-card__top">
                <h4 className="course-card__title">{title}</h4>
                {project.status === 'in-progress' && (
                  <span className="status" data-status="in-progress">
                    {ui.statusInProgress}
                  </span>
                )}
              </div>
              <p className="course-card__meta">
                {[project.course, source, project.year].filter(Boolean).join(' · ')}
              </p>
              <p className="course-card__text">{project.summary[locale]}</p>
              {project.stack.length > 0 && (
                <ul className="chips">
                  {project.stack.map((tech) => (
                    <li key={tech} className="chip chip--subtle">
                      {tech}
                    </li>
                  ))}
                </ul>
              )}
              {cert?.verifyUrl && (
                <div className="course-card__links">
                  <ExternalLink
                    href={cert.verifyUrl}
                    newTabHint={ui.opensInNewTab}
                    className="link-muted"
                  >
                    {ui.verify}
                    <span className="sr-only">: {cert.name}</span>
                  </ExternalLink>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
