/**
 * @file Certifications.tsx
 * Certificate cards: issuer badge, name, date, official "Verify" link and an
 * on-demand image viewer.
 */
import { certifications, formatMonthYear, type SiteContent } from '@portfolio/content';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { withBasePath } from '@/lib/site';
import { CertificateDialog } from './CertificateDialog';
import { Section } from './Section';

/**
 * Short issuer mark for the badge, e.g. "IBM & SkillUp" → "I".
 * Text (not logos) avoids trademark images and stays readable in both themes.
 */
export function issuerInitial(issuer: string): string {
  return issuer.trim().charAt(0).toUpperCase();
}

/** Renders the Certifications section. */
export function Certifications({ content }: { content: SiteContent }) {
  const { certifications: section, ui, locale } = content;
  return (
    <Section id="certifications" title={section.title} intro={section.intro} alt>
      <ul className="cert-grid">
        {certifications.map((cert) => (
          <li key={cert.id} className="card card--interactive cert-card" data-reveal>
            <span className="cert-card__badge" aria-hidden="true">
              {issuerInitial(cert.issuer)}
            </span>
            <div className="cert-card__body">
              <h3 className="cert-card__name">{cert.name}</h3>
              <p className="cert-card__meta">
                <span className="sr-only">{ui.issuedBy} </span>
                {cert.issuer} ·{' '}
                <time dateTime={cert.date}>{formatMonthYear(cert.date, locale)}</time>
              </p>
              <div className="cert-card__actions">
                {cert.verifyUrl && (
                  <ExternalLink
                    href={cert.verifyUrl}
                    newTabHint={ui.opensInNewTab}
                    className="btn btn--secondary btn--sm"
                  >
                    {ui.verify}
                    <span className="sr-only">: {cert.name}</span>
                  </ExternalLink>
                )}
                <CertificateDialog
                  name={cert.name}
                  src={withBasePath(cert.image)}
                  width={cert.width}
                  height={cert.height}
                  labels={{
                    view: ui.viewCertificate,
                    close: ui.close,
                    titlePrefix: ui.certificateOf,
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
