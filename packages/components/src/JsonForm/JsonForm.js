import React, { useMemo, useContext } from "react";
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { get } from 'lodash';

import { JsonFormContext } from './JsonFormContext';

import { i18nDefaults } from './../utils/i18nDefaults';

//import { useTranslation } from 'react-i18next';

export const JsonForm = (props) => {
  const {
    data,
    onChange,
    schema,
    uischema,
    renderers,
    cells,
    locale,
    i18n,
  } = props;

  /*
  const { t } = useTranslation();
  const s = t('welcome');
  console.log(`Teste : ${s}`);
  */

  const ctx = useContext(JsonFormContext);

  const translation = useMemo(() => {
    let translations = i18nDefaults;
    if (ctx?.translations) {
      translations = {
        ...i18nDefaults,
        ...ctx.translations
      }
    }
    if (props.translations) {
      translations = {
        ...i18nDefaults,
        ...props.translations
      }
    }
    const createTranslator = (locale) => (key, defaultMessage) => {
      let msg;
      locale
        ? msg = get(translations, `${locale}.${key}`, get(translations, `${key}`, defaultMessage))
        : msg = get(translations, `${key}`, defaultMessage);
      return msg;
    };
    return createTranslator(locale);
  },  [props.locale, props.translations, props.i18n]);

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

