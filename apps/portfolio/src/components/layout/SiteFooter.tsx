/**
 * @file SiteFooter.tsx
 * Footer: copyright, how the site is built, link to the source code.
 * (Going back to the top is handled by the floating BackToTop button.)
 */
import type { SiteContent } from '@portfolio/content';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { REPO_URL } from '@/lib/site';

/** Build year — the site is static, so this is fixed at build time. */
const YEAR = new Date().getFullYear();

/** Renders the footer for one language. */
export function SiteFooter({ content }: { content: SiteContent }) {
  const { ui, hero } = content;
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          © {YEAR} {hero.name}
        </p>
        <p className="site-footer__built">
          {ui.footerBuiltWith}{' '}
          <ExternalLink href={REPO_URL} newTabHint={ui.opensInNewTab}>
            {ui.sourceCode}
          </ExternalLink>
        </p>
      </div>
    </footer>
  );
}
