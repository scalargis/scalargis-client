import pt from './pt.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';

//import { all } from "primelocale";
import { pt as primereactPT } from "primelocale/js/pt.js";
import { en as primereactEN } from "primelocale/js/en.js";
import { es as primereactES } from "primelocale/js/es.js";
import { fr as primereactFR } from "primelocale/js/fr.js";

const translations = {
  pt,
  en,
  es,
  fr
}

export const primereactTranslations = {
  pt: primereactPT,
  en: primereactEN,
  es: primereactES,
  fr: primereactFR
}

export default translations;