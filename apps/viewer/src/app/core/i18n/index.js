import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import { addLocale, locale } from 'primereact/api';

import { i18n } from '@scalargis/components';

import { getAppDefaultLocale, getAppApiUrl } from './../utils';
import resources from './translations';
import { primereactTranslations as primereactResources } from './translations';


export const initTranslations = () => {
  const defaultLocale = getAppDefaultLocale();

  const options = {
    //resources,
    resources: {},
    defaultNS: 'common',
    fallbackLng: defaultLocale || 'pt',
    //keySeparator: "false", // we do not use keys in form key.text
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  }

  // Read localStorage synchronously to avoid initial render with wrong language
  const storedLang = localStorage.getItem('i18nextLng');
  if (storedLang) {
    // User has a preference - use it immediately
    options["lng"] = storedLang;
  } else if (defaultLocale) {
    // No user preference - use backend default
    options["lng"] = defaultLocale;
  }
  // LanguageDetector will still handle future changes and save to localStorage

  i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .init(options);
  
  Object.entries(resources).forEach(([lang, translations]) => {
    i18next.addResourceBundle(lang, "common", translations, true, true);
  });

  //Add primereact translations
  Object.entries(primereactResources).forEach(([lang, translations]) => {
    addLocale(lang, translations);
  });
  locale(i18next.language);
}

export const loadTranslations = (id, callback) => {
  const API_URL = getAppApiUrl();
  const url = `${API_URL}/app/viewer/${id}/translations`;
  i18n.loadBackendTranslations(url, true, true, (data, error) => {
    if (callback) {
      callback(data, error, i18next?.options?.ns);
    };
    //console.log(data);
    //console.log(i18n.getTranslations());
  });
}