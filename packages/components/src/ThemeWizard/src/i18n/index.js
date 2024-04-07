import { loadTranslations as _loadTranslations } from "../../../utils/i18n";

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
  _loadTranslations(_ns, translations);
}

export default translations;