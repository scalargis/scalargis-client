import React, { useMemo, useContext, useEffect } from "react";
import i18next from "i18next";
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { get, merge } from 'lodash';

import { JsonFormContext } from './JsonFormContext';
import { i18nDefaults } from './util/i18nDefaults';
import { getTranslations } from './../utils/i18n';
import { useFigTreeEvaluator } from './useFigTreeEvaluator';


export const JsonForm = (props) => {
  const {
    data,
    onChange,
    schema,
    uischema,
    renderers,
    cells,
    i18n,
    figTreeEvaluatorOptions,
    loadingElement
  } = props;

  const ctx = useContext(JsonFormContext);
  
  const locale = useMemo(()=> {
    return props.locale || i18next.resolvedLanguage;
  }, [i18next.resolvedLanguage]);

  const translation = useMemo(() => {
    let translations = merge(i18nDefaults, getTranslations());  
    
    //console.log(ctx?.translations);

    if (ctx?.translations) {
      translations = merge(translations, ctx.translations);
    }
    if (props.translations) {
      translations = merge(translations, props.translations);
    }

    //console.log(translations);

    const createTranslator = (locale) => (key, defaultMessage) => {

      //console.log({ key, defaultMessage});

      let msg;
      locale
        ? msg = get(translations, `${locale}.${key}`, get(translations, `${key}`, defaultMessage))
        : msg = get(translations, `${key}`, defaultMessage);
      return msg;
    };
    return createTranslator(locale);
  },  [props.locale, props.translations, props.i18n, i18next.resolvedLanguage]);


  const _i18n = i18n || ctx?.i18n || {locale: locale, translate: translation} 

  const defaultLoadingElement = useMemo(() => {  
    return {
      type: 'VerticalLayout',
      elements: [{ type: 'Html', text: `<div class="p-mb-4"><i class="pi pi-spin pi-spinner p-mr-2" style={{'fontSize': '2em'}}></i><span>${_i18n.translate("common.loading", "A carregar ...")}</span></div>` }],
    }
  }, [i18next.resolvedLanguage]);

  const _loadingElement =  loadingElement || defaultLoadingElement;

  const { evaluatedSchema = {}, evaluatedUiSchema } = useFigTreeEvaluator(data, schema, uischema, figTreeEvaluatorOptions, _loadingElement);


  return (
    <JsonForms
      schema={evaluatedSchema}
      uischema={evaluatedUiSchema}
      data={data}
      onChange={onChange}
      renderers={renderers || defaultRenderers}
      cells={cells || vanillaCells}
      i18n={_i18n}
    />
  );
}

export default JsonForm;

