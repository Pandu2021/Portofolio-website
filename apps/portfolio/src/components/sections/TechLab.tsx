/**
 * @file TechLab.tsx
 * One card per framework app, generated from the showcase registry
 * (`packages/content/src/data/showcase.json`), followed by the course projects.
 */
import { showcase, type ShowcaseStatus, type SiteContent } from '@portfolio/content';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
import { repoTreeUrl, withBasePath } from '@/lib/site';
import { CourseProjects } from './CourseProjects';
import { Section } from './Section';

/** Renders the Tech Lab grid. */
export function TechLab({ content }: { content: SiteContent }) {
  const { techLab, ui, locale } = content;
  const statusLabel: Record<ShowcaseStatus, string> = {
    live: ui.statusLive,
    'in-progress': ui.statusInProgress,
    planned: ui.statusPlanned,
  };

  return (
    <Section id="tech-lab" title={techLab.title} intro={techLab.intro}>
      <ul className="lab-grid">
        {showcase.map((app) => {
          const isHome = app.path === '';
          const isPlanned = app.status === 'planned';
          return (
            <li key={app.id} className="card card--interactive lab-card" data-reveal>
              <div className="lab-card__top">
                <span className="badge" data-brand={app.brand}>
                  {app.framework}
                </span>
                <span className="status" data-status={app.status}>
                  {statusLabel[app.status]}
                </span>
              </div>
              <h3 className="lab-card__title">{app.title[locale]}</h3>
              <p className="lab-card__text">{app.description[locale]}</p>
              <ul className="chips">
                {app.stack.map((tech) => (
                  <li key={tech} className="chip chip--subtle">
                    {tech}
                  </li>
                ))}
              </ul>
              {!isPlanned && (
                <div className="lab-card__links">
                  {isHome ? (
                    <span className="lab-card__here">
                      <Icon name="pin" size={16} />
                      {ui.youAreHere}
                    </span>
                  ) : (
                    <a href={withBasePath(app.path)} className="link-strong">
                      {ui.liveDemo}
                      <span className="sr-only">: {app.title[locale]}</span>
                    </a>
                  )}
                  <ExternalLink
                    href={repoTreeUrl(app.sourcePath)}
                    newTabHint={ui.opensInNewTab}
                    className="link-muted"
                  >
                    <Icon name="code" size={16} />
                    {ui.sourceCode}
                    <span className="sr-only">: {app.framework}</span>
                  </ExternalLink>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <CourseProjects content={content} />
    </Section>
  );
}
