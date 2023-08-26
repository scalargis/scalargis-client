import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

import { getAppDefaultLocale } from './../utils';
import resources from './translations';

const defaultLocale = getAppDefaultLocale();

const options = {
  resources,
  fallbackLng: defaultLocale || 'en',
  //keySeparator: "false", // we do not use keys in form key.text
  interpolation: {
    escapeValue: false // react already safes from xss
  }
}
if (defaultLocale) options["lng"] = defaultLocale;

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init(options);
  
export default i18n;