/**
 * @file Layout.tsx
 * Page frame: skip link, demo notice, header with navigation and controls,
 * main content (router outlet) and footer.
 */
import type { MouseEvent } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { useCart } from '../cart/CartContext';
import { useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

const REPO_URL = 'https://github.com/Pandu2021/Portofolio-website/tree/main/apps/react-storefront';

/** Shared layout for every route. */
export function Layout() {
  const { t, locale } = useI18n();
  const { count } = useCart();
  // The portfolio lives one level up: /Portofolio-website/ (EN) or /Portofolio-website/id/.
  const portfolioHref = locale === 'id' ? '../id/' : '../';

  /**
   * Hash routing uses the URL fragment for routes, so a plain `#main` link
   * would navigate to a "main" route (404). Move focus to <main> instead.
   */
  const skipToMain = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('main')?.focus();
  };

  return (
    <>
      <a href="#main" className="skip-link" onClick={skipToMain}>
        {t.skipToContent}
      </a>
      <p className="demo-banner">{t.demoBanner}</p>

      <header className="header">
        <div className="container header__inner">
          <Link to="/" className="brand">
            <span className="brand__mark" aria-hidden="true">
              KD
            </span>
            {t.brand}
          </Link>

          <nav aria-label={t.mainNav} className="header__nav">
            <NavLink to="/" end className="nav-link">
              {t.navMenu}
            </NavLink>
            <NavLink to="/cart" className="nav-link nav-link--cart" aria-label={t.cartCount(count)}>
              <Icon name="cart" size={20} />
              <span aria-hidden="true">{t.navCart}</span>
              <span className="badge" aria-hidden="true">
                {count}
              </span>
            </NavLink>
          </nav>

          <div className="header__controls">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="container main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <a href={portfolioHref} className="link-strong">
            <Icon name="arrowLeft" size={16} />
            {t.backToPortfolio}
          </a>
          <p>{t.footerNote}</p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="link-muted">
            {t.sourceCode}
            <Icon name="external" size={14} />
            <span className="sr-only"> {t.opensInNewTab}</span>
          </a>
        </div>
      </footer>
    </>
  );
}
