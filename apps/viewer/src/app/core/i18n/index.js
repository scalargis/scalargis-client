import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

import { i18n } from '@scalargis/components';

import { getAppDefaultLocale, getAppApiUrl } from './../utils';
import resources from './translations';

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
    }
  }
  if (defaultLocale) options["lng"] = defaultLocale;
  
  i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .init(options);
  
  Object.entries(resources).forEach(([lang, translations]) => {
    i18next.addResourceBundle(lang, "common", translations, true, true);
  });
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