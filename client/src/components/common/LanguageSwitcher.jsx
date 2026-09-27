// src/components/common/LanguageSwitcher.jsx
// Toggles between Japanese and English. i18next persists the choice to
// localStorage (see i18n.js detection config), so it survives reloads.

import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language;

  return (
    <div className="lang-switcher" role="group" aria-label={i18n.t('auth.language')}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`lang-switcher__btn ${current === code ? 'is-active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={current === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
