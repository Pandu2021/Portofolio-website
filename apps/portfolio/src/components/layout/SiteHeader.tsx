/**
 * @file SiteHeader.tsx
 * Sticky site header: brand, primary navigation, language switch,
 * theme toggle and CV download (the full two-page CV).
 */
import type { SiteContent } from '@portfolio/content';
import { Icon } from '@/components/ui/Icon';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CV_DOWNLOAD_NAME, CV_FILE, withBasePath } from '@/lib/site';
import { SiteNav } from './SiteNav';

/** Renders the header for one language. */
export function SiteHeader({ content }: { content: SiteContent }) {
  const { nav, ui, hero, locale } = content;
  const items = [
    { id: 'about', label: nav.about },
    { id: 'projects', label: nav.projects },
    { id: 'skills', label: nav.skills },
    { id: 'experience', label: nav.experience },
    { id: 'certifications', label: nav.certifications },
    { id: 'contact', label: nav.contact },
  ];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href="#top" className="brand">
          <span className="brand__mark" aria-hidden="true">
            PW
          </span>
          <span className="brand__name">{hero.name}</span>
        </a>

        <SiteNav
          items={items}
          navLabel={ui.mainNav}
          openLabel={ui.openMenu}
          closeLabel={ui.closeMenu}
        >
          <LanguageSwitch locale={locale} label={ui.languageSwitch} />
          <ThemeToggle
            labels={{
              toggle: ui.themeToggle,
              light: ui.themeLight,
              dark: ui.themeDark,
              system: ui.themeSystem,
            }}
          />
          <a
            href={withBasePath(CV_FILE)}
            download={CV_DOWNLOAD_NAME}
            className="btn btn--primary btn--sm btn--shine"
          >
            <Icon name="download" size={16} />
            {nav.cv}
          </a>
        </SiteNav>
      </div>
    </header>
  );
}
