/**
 * @file Hero.tsx
 * First screen: name (the page's only H1), role, value proposition and the two
 * main actions. The code card on the right is decorative (aria-hidden).
 */
import type { SiteContent } from '@portfolio/content';
import { Icon } from '@/components/ui/Icon';
import { RESUME_DOWNLOAD_NAME, RESUME_FILE, withBasePath } from '@/lib/site';

/** Renders the hero section. */
export function Hero({ content }: { content: SiteContent }) {
  const { hero } = content;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__text">
          <p className="pill">
            <span className="pill__dot" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="hero__title">
            {hero.name}
          </h1>
          <p className="hero__role">{hero.role}</p>
          <p className="hero__tagline">{hero.tagline}</p>
          <div className="hero__actions">
            <a href="#projects" className="btn btn--primary">
              {hero.ctaPrimary}
              <Icon name="arrowDown" size={16} />
            </a>
            <a
              href={withBasePath(RESUME_FILE)}
              download={RESUME_DOWNLOAD_NAME}
              className="btn btn--secondary"
            >
              <Icon name="download" size={16} />
              {hero.ctaSecondary}
            </a>
          </div>
          <p className="hero__meta">
            <Icon name="pin" size={16} />
            {hero.availability}
          </p>
        </div>

        <div className="code-card" aria-hidden="true">
          <div className="code-card__bar">
            <span />
            <span />
            <span />
            <span className="code-card__file">developer.ts</span>
          </div>
          <pre className="code-card__body">
            <code>
              <span className="tok-k">const</span> <span className="tok-v">developer</span> = {'{'}
              {'\n  '}
              <span className="tok-p">name</span>:{' '}
              <span className="tok-s">&apos;{hero.name}&apos;</span>,{'\n  '}
              <span className="tok-p">focus</span>: [
              <span className="tok-s">&apos;React&apos;</span>,{' '}
              <span className="tok-s">&apos;Angular&apos;</span>,{' '}
              <span className="tok-s">&apos;TypeScript&apos;</span>],
              {'\n  '}
              <span className="tok-p">backend</span>: [
              <span className="tok-s">&apos;NestJS&apos;</span>,{' '}
              <span className="tok-s">&apos;PostgreSQL&apos;</span>],
              {'\n  '}
              <span className="tok-p">cares</span>: [<span className="tok-s">&apos;a11y&apos;</span>
              , <span className="tok-s">&apos;security&apos;</span>,{' '}
              <span className="tok-s">&apos;tests&apos;</span>],
              {'\n  '}
              <span className="tok-p">openToWork</span>: <span className="tok-k">true</span>,{'\n'}
              {'};'}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
