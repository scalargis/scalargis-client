import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { ComponentType } from 'react';
import Ajv from 'ajv';
import {
  getAjv,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
  UISchemaElement
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';

export const renderLayoutElements = (
  elements,
  schema,
  path,
  enabled,
  renderers,
  cells,
  className
) => {
  return elements.map((child, index) => (
    <div key={`${path}-${index}`} className={className ? `p-field ${className}` : 'p-field'}>
      <JsonFormsDispatch
        uischema={child}
        schema={schema}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
    </div>
  ));
};

export const withAjvProps = (Component) =>
    (props) => {
    const ctx = useJsonForms();
    const ajv = getAjv({jsonforms: {...ctx}});

    return (<Component {...props} ajv={ajv} />);
  };