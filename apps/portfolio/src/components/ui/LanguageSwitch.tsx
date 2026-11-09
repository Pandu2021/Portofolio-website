/**
 * @file LanguageSwitch.tsx
 * EN | ID switch. Plain links (each language is a separate static page),
 * so it works without JavaScript and is crawlable.
 */
import { localeLabel, localePath, localeTag, locales, type Locale } from '@portfolio/content';
import { withBasePath } from '@/lib/site';

interface LanguageSwitchProps {
  /** Language of the current page. */
  locale: Locale;
  /** Accessible group label, e.g. "Language". */
  label: string;
}

/** Renders one link per language; the current one is marked `aria-current`. */
export function LanguageSwitch({ locale, label }: LanguageSwitchProps) {
  return (
    <div className="lang-switch" role="group" aria-label={label}>
      {locales.map((target) => (
        <a
          key={target}
          href={withBasePath(localePath(target))}
          hrefLang={localeTag[target]}
          lang={localeTag[target]}
          aria-current={target === locale ? 'page' : undefined}
          className="lang-switch__link"
        >
          {target.toUpperCase()}
          <span className="sr-only"> — {localeLabel[target]}</span>
        </a>
      ))}
    </div>
  );
}
