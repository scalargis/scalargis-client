import { useState, useEffect, useMemo } from 'react';
import { FigTreeEvaluator } from 'fig-tree-evaluator';
import extractProperty from 'object-property-extractor';
import assign from 'object-property-assigner';

import { i18n } from '../components';

import { checkDate, getAsOneOfObjects } from './util/customFunctions';


const defaultFunctions = { checkDate, getAsOneOfObjects };

/** Builds the evaluator of one form, with the default functions and the form options. */
const createEvaluator = (figOptions) => new FigTreeEvaluator({
  evaluateFullObject: true,
  ...figOptions,
  functions: { ...defaultFunctions, ...figOptions?.functions }
});


export const useFigTreeEvaluator = (data, schema, uischema, figOptions, loadingElement) => {
  const [fig] = useState(() => createEvaluator(figOptions));
  const [evaluatedSchema, setEvaluatedSchema] = useState();
  const [evaluatedUiSchema, setEvaluatedUiSchema] = useState(loadingElement ? loadingElement : {
    type: 'VerticalLayout',
    elements: [{ type: 'Html', text: `<div class="mb-4"><span class="sg-spinner mr-2"></span><span>${i18n.translateValue("loading", "A carregar ...")}</span></div>` }],
  });
  // This value prevents the form rendering with an empty schema on first load, otherwise it's just full of "no applicable renderer" errors
  const [schemaEvaluated, setSchemaEvaluated] = useState(false);

  const simplifiedRulePaths = useMemo(() => {
    const paths = [];
    traverseSchema(uischema, paths, '');
    return paths;
  }, [schema, uischema]);

  useEffect(() => {
    let current = true;

    if (schemaEvaluated)
      fig.evaluate(uischema, { data }).then((result) => {
        if (!current) return;
        setEvaluatedUiSchema(replaceRules(result, simplifiedRulePaths));
      });

    fig.evaluate(schema, { data }).then((result) => {
      if (!current) return;
      setEvaluatedSchema(result);
      setSchemaEvaluated(true);
    });

    return () => { current = false; };
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

  let output = schema;
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
    if (ruleType) output = assign(output, basePath + '.rule', { effect: ruleType, condition: true });
  });
  return output;
};
