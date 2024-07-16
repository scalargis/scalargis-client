import { useState, useEffect, useMemo } from 'react';
import { FigTreeEvaluator } from 'fig-tree-evaluator';
import extractProperty from 'object-property-extractor';
import assign from 'object-property-assigner';

import { i18n } from '@scalargis/components';

import { checkDate, getAsOneOfObjects } from './util/customFunctions';


const fig = new FigTreeEvaluator({ evaluateFullObject: true, functions: { checkDate, getAsOneOfObjects } });


export const useFigTreeEvaluator = (data, schema, uischema, figOptions, loadingElement) => {
  const [evaluatedSchema, setEvaluatedSchema] = useState();
  const [evaluatedUiSchema, setEvaluatedUiSchema] = useState(loadingElement ? loadingElement : {
    type: 'VerticalLayout',
    elements: [{ type: 'Html', text: `<div class="p-mb-4"><i class="pi pi-spin pi-spinner p-mr-2" style={{'fontSize': '2em'}}></i><span>${i18n.translateValue("loading", "A carregar ...")}</span></div>` }],
  });
  // This value prevents the form rendering with an empty schema on first load, otherwise it's just full of "no applicable renderer" errors
  const [schemaEvaluated, setSchemaEvaluated] = useState(false);

  const simplifiedRulePaths = useMemo(() => {
    const paths = [];
    traverseSchema(uischema, paths, '');
    return paths;
  }, [schema, uischema]);

  useEffect(() => {
    if (figOptions) {
      let options = fig.getOptions();
      options = {
        ...options,
        ...figOptions
      }
      fig.updateOptions(options);
    }
  }, []);

  useEffect(() => {
    if (schemaEvaluated)
      fig.evaluate(uischema, { data }).then((result) => {
        replaceRules(result, simplifiedRulePaths);
        setEvaluatedUiSchema(result);
      });

    fig.evaluate(schema, { data }).then((result) => {
      setEvaluatedSchema(result);
      setSchemaEvaluated(true);
    });
  }, [data, simplifiedRulePaths, schemaEvaluated]);

  return { evaluatedSchema, evaluatedUiSchema };
};


const isObject = (value) => value instanceof Object && value !== null;


const traverseSchema = (schema, paths, currentPath) => {
  if (Array.isArray(schema)) {
    schema.forEach((elem, idx) => traverseSchema(elem, paths, `${currentPath}[${idx}]`));
    return;
  }

  if (!isObject(schema)) return;

  Object.entries(schema).forEach(([key, value]) => {
    const newPath = currentPath === '' ? key : currentPath + '.' + key;

    if (key === 'visible' || key === 'enabled') {
      paths.push(newPath);
      return;
    }

    traverseSchema(value, paths, newPath);
  });
};


const replaceRules = (schema, paths) => {
  const rules = new Map();
  paths.forEach((path) => {
    const value = extractProperty(schema, path);

    const matches = path.match(/(^.+)\.(enabled|visible)$/);
    const basePath = matches?.[1] ?? '';
    const type = matches?.[2] ?? '';

    rules.set(basePath, { ...rules.get(basePath), [type]: value });
  });

  rules.forEach((values, basePath) => {
    const { enabled = true, visible = true } = values;
    const ruleType =
      enabled && visible
        ? 'SHOW'
        : enabled && !visible
        ? 'HIDE'
        : !enabled && visible
        ? 'DISABLE'
        : !enabled && !visible
        ? 'HIDE'
        : null;
    // This is a hacky way to circumvent the limitations of JsonForms rules --
    // we're intentionally supplying an invalid condition so that it "falls
    // through" and always returns `true` and we rely on the `ruleType` being
    // changed dynamically instead
    if (ruleType) assign(schema, basePath + '.rule', { effect: ruleType, condition: true });
  });
};
