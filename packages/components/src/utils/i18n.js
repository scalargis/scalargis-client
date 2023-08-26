import i18n from "i18next";

export const loadResources = (ns, resources, deep=true, overwrite=true) => {
  Object.entries(resources).forEach(([lang, translations]) => {
    i18n.addResourceBundle(lang, ns, translations, deep, overwrite);
  });
}