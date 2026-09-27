// src/i18n.js
// i18next configuration. Translation files are fetched at runtime from
// public/locales/{lng}/translation.json (see i18next-http-backend) rather
// than bundled, so they can be edited without a rebuild.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const STORAGE_KEY = 'techmatch_language';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Japanese is the default per the users table's preferred_language
    // default ('ja') and this project's primary audience.
    fallbackLng: 'ja',
    supportedLngs: ['ja', 'en'],
    nonExplicitSupportedLngs: true,

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    detection: {
      // Only an explicit choice (persisted to localStorage) overrides the
      // fallbackLng default. We deliberately don't sniff navigator.language,
      // since this platform is Japanese-first by design (see users.preferred_language
      // default of 'ja') and a browser locale shouldn't silently override that.
      order: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes output
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
