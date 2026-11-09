/**
 * @file Highlights.tsx
 * Four key numbers recruiters can scan in seconds.
 */
import type { SiteContent } from '@portfolio/content';

/** Renders the highlights strip (labelled region, no visible heading). */
export function Highlights({ content }: { content: SiteContent }) {
  return (
    <section className="highlights" aria-label={content.ui.highlightsLabel}>
      <ul className="container highlights__grid">
        {content.highlights.map((item) => (
          <li key={item.label} className="card stat" data-reveal>
            <span className="stat__value">{item.value}</span>
            <span className="stat__label">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
