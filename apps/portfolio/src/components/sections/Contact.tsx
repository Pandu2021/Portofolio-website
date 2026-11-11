/**
 * @file Contact.tsx
 * Contact call-to-action. Deliberately no phone number, e-mail address or
 * contact form (privacy + no server on GitHub Pages): visitors use LinkedIn.
 */
import type { SiteContent } from '@portfolio/content';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
import {
  CV_DOWNLOAD_NAME,
  CV_FILE,
  RESUME_DOWNLOAD_NAME,
  RESUME_FILE,
  withBasePath,
} from '@/lib/site';

/** Renders the Contact section. */
export function Contact({ content }: { content: SiteContent }) {
  const { contact, ui } = content;
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact-card" data-reveal>
          <h2 id="contact-title" className="section__title">
            {contact.title}
          </h2>
          {contact.intro && <p className="contact-card__intro">{contact.intro}</p>}
          <p className="contact-card__body">{contact.body}</p>
          <ul className="contact-card__links">
            {contact.links.map((link, index) => (
              <li key={link.href}>
                <ExternalLink
                  href={link.href}
                  newTabHint={ui.opensInNewTab}
                  className={index === 0 ? 'btn btn--primary btn--shine' : 'btn btn--secondary'}
                >
                  {link.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
          <ul className="contact-card__downloads">
            <li>
              <a
                href={withBasePath(RESUME_FILE)}
                download={RESUME_DOWNLOAD_NAME}
                className="link-strong"
              >
                <Icon name="download" size={16} />
                {contact.resumeLabel}
              </a>
            </li>
            <li>
              <a href={withBasePath(CV_FILE)} download={CV_DOWNLOAD_NAME} className="link-strong">
                <Icon name="download" size={16} />
                {contact.cvLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
