/**
 * @file HomePage.tsx
 * Home page for one language.
 *
 * Phase 1 scaffold: proves the wiring between Next.js, @portfolio/content and
 * @portfolio/design-tokens. The full one-page design is built in Phase 2.
 */
import { getContent, showcase, type Locale } from '@portfolio/content';
import styles from './HomePage.module.css';

interface HomePageProps {
  locale: Locale;
}

/** Renders the (scaffold) home page in the given language. */
export function HomePage({ locale }: HomePageProps) {
  const content = getContent(locale);
  return (
    <main id="main" className={styles.main}>
      <p className={styles.eyebrow}>{content.hero.eyebrow}</p>
      <h1 className={styles.title}>{content.hero.name}</h1>
      <p className={styles.role}>{content.hero.role}</p>
      <h2>{content.techLab.title}</h2>
      <ul>
        {showcase.map((app) => (
          <li key={app.id}>
            <strong>{app.framework}</strong> — {app.title[locale]}
          </li>
        ))}
      </ul>
    </main>
  );
}
