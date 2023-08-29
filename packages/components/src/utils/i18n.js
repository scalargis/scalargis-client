import i18next from "i18next";

export const loadTranslations = (ns, resources, deep=true, overwrite=true) => {
  Object.entries(resources).forEach(([lang, translations]) => {
    i18next.addResourceBundle(lang, ns, translations, deep, overwrite);
  });
}

export const loadBackendTranslations = (url, deep=true, overwrite=true, callback=undefined) => { 
  let options = {
    headers: {
      'Accept': 'application/json'
    },
    method: 'GET'
  }    

  fetch(url, options)
    .then(res => res.json())
    .then(res => {
      Object.keys(res).forEach(ns => {
        Object.entries(res[ns]).forEach(([lang, translations]) => {
          i18next.addResourceBundle(lang, ns, translations, true, true);
        });
      });
      if (callback) callback(res, null);
    }).catch(error => {
      if (callback) callback(null, error);
    });
}

export const getTranslations = () => {
  return i18next.options.resources;
}