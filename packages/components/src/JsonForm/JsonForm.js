import React, { useMemo, useContext, useEffect } from "react";
import i18next from "i18next";
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { createAjv, toDataPath, toDataPathSegments } from '@jsonforms/core';
import { get, set, merge } from 'lodash';

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
    ajvOptions,
    validationMode,
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


  const ajv = useMemo(() => {
    let _ajv;
    if (!ajvOptions) {
      _ajv = createAjv({useDefaults: true});
    } else {
      _ajv = createAjv({useDefaults: true, ...ajvOptions});
    }

    if (_ajv?.schemas) {
      for (const item in _ajv?.schemas) {
        if (_ajv.schemas[item]?.schema?.definitions?.schemaArray?.minItems != null) {
          _ajv.schemas[item].schema.definitions.schemaArray.minItems = 0;
        }
        if (_ajv.schemas[item]?.schema?.properties?.enum?.minItems != null) {
          _ajv.schemas[item].schema.properties.enum.minItems = 0;
        }
      }
    }

    return _ajv;
  }, [ajvOptions]);

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
      onChange={({ data, errors }) => {
        /*
        if (errors?.length) {
          errors.forEach((err, index) => {
            console.log(err);
            if (err.keyword === "oneOf" || err.keyword === "enum") {
              const path = toDataPath(err.schemaPath);
              set(data, path, undefined);
              errors.splice(index, 1);
            }
          });
        }
        console.log({evaluatedSchema, evaluatedUiSchema, data, errors});
        */
        onChange({ data, errors });
      }}
      renderers={renderers || defaultRenderers}
      cells={cells || vanillaCells}
      i18n={_i18n}
      ajv={ajv}
      validationMode={validationMode}
    />
  );
}

export default JsonForm;

