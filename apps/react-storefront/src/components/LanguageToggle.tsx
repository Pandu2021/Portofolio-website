/**
 * @file LanguageToggle.tsx
 * EN | ID toggle. Buttons with `aria-pressed` (the app has one URL per page,
 * the language is a preference).
 */
import { useI18n } from '../i18n/I18nContext';
import { LOCALES, LOCALE_TAG } from '../i18n/messages';

const NAMES = { en: 'English', id: 'Bahasa Indonesia' } as const;

/** Two-button language switch. */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t.languageLabel}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className="lang-switch__button"
          lang={LOCALE_TAG[option]}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
        >
          {option.toUpperCase()}
          <span className="sr-only"> — {NAMES[option]}</span>
        </button>
      ))}
    </div>
  );
}
