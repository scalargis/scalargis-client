import React, { useMemo, useEffect } from "react";
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { get } from 'lodash';



import { i18nDefaults as translations } from './../utils/i18nDefaults';




const createTranslator = (locale) => (key, defaultMessage) => {
  //console.log(get(translations, `${locale}.${key}`, get(translations, `${key}`, defaultMessage)));
  let msg;
  locale 
    ? msg = get(translations, `${locale}.${key}`, get(translations, `${key}`, defaultMessage))
    : mgs = get(translations, `${key}`, defaultMessage);

  /*
  console.log({
    key:`${locale}.${key}`,
    message: msg
  });
  */

  return msg;
};

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

  const translation = useMemo(() => createTranslator(locale), [props.locale, props.i18n]);

  useEffect(() => {
    console.log('Entrei');
  }, []);

  //const LayerContext = createContext();

  return (
    <JsonForms
      data={data}
      onChange={onChange}
      schema={schema}
      uischema={uischema}
      renderers={renderers || defaultRenderers}
      cells={cells || vanillaCells}
      //i18n={{locale: locale, translate: translation}}
      i18n={i18n || {locale: locale, translate: translation}}
    />
  );
}

export default JsonForm;

