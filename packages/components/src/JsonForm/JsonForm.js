import React, { useMemo, useContext, useEffect } from "react";
import i18next from "i18next";
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { get, merge } from 'lodash';

import { JsonFormContext } from './JsonFormContext';
import { i18nDefaults } from './util/i18nDefaults';
import { getTranslations } from './../utils/i18n';

export const JsonForm = (props) => {
  const {
    data,
    onChange,
    schema,
    uischema,
    renderers,
    cells,
    i18n,
  } = props;

  const ctx = useContext(JsonFormContext);
  
  const locale = useMemo(()=> {
    return props.locale || i18next.language;
  }, [i18next.language]);

  const translation = useMemo(() => {
    let translations = merge(i18nDefaults, getTranslations());  
    
    //console.log(ctx?.translations);

    if (ctx?.translations) {
      translations = merge(translations, ctx.translations);
    }
    if (props.translations) {
      translations = merge(translations, props.translations);
    }

    const createTranslator = (locale) => (key, defaultMessage) => {

      //console.log({ key, defaultMessage});

      let msg;
      locale
        ? msg = get(translations, `${locale}.${key}`, get(translations, `${key}`, defaultMessage))
        : msg = get(translations, `${key}`, defaultMessage);
      return msg;
    };
    return createTranslator(locale);
  },  [props.locale, props.translations, props.i18n, i18next.language]);

  return (
    <JsonForms
      data={data}
      onChange={onChange}
      schema={schema}
      uischema={uischema}
      renderers={renderers || defaultRenderers}
      cells={cells || vanillaCells}
      i18n={i18n || ctx?.i18n || {locale: locale, translate: translation}}
    />
  );
}

export default JsonForm;

