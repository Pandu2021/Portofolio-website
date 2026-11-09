/**
 * @file Section.tsx
 * Shared wrapper for page sections: landmark, H2 title, optional intro.
 */
import type { ReactNode } from 'react';

interface SectionProps {
  /** Anchor id used by the navigation (e.g. `skills`). */
  id: string;
  title: string;
  intro?: string | undefined;
  /** Alternate background for visual rhythm. */
  alt?: boolean;
  children: ReactNode;
}

/** `<section>` labelled by its H2 heading. */
export function Section({ id, title, intro, alt = false, children }: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      className={alt ? 'section section--alt' : 'section'}
      aria-labelledby={headingId}
    >
      <div className="container">
        <header className="section__head" data-reveal>
          <h2 id={headingId} className="section__title">
            {title}
          </h2>
          {intro && <p className="section__intro">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
