import { i18n } from '@scalargis/components';

import pt from './translations/pt.json';
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';

const translations = {
  pt,
  en,
  es,
  fr
}

export const I18N_NAMESPACE = "ThemeWizard";

export const loadTranslations = (ns) => {
  const _ns = ns || I18N_NAMESPACE;
  i18n.loadTranslations(_ns, translations);
}

export default translations;