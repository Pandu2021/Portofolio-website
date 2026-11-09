/**
 * @file NotFoundPage.tsx
 * Shown for unknown hash routes such as `#/does-not-exist`.
 */
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useI18n } from '../i18n/I18nContext';

/** 404 inside the storefront. */
export function NotFoundPage() {
  const { t } = useI18n();
  useDocumentTitle(t.notFoundTitle);
  return (
    <div className="empty">
      <h1>{t.notFoundTitle}</h1>
      <Link to="/" className="btn btn--primary">
        {t.backToMenu}
      </Link>
    </div>
  );
}
