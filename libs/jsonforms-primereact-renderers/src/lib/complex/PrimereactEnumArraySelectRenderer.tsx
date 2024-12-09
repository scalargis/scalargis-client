import {
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  JsonSchema,
  OwnPropsOfEnum,
  Paths,
  RankedTester,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  optionIs,  
  uiTypeIs,
} from '@jsonforms/core';

import {
  TranslateProps,
  withTranslateProps
} from '@jsonforms/react';

import merge from 'lodash/merge';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import { PrimereactMultiSelect } from '../primereact-controls';
import { PrimereactInputControl } from '../controls/PrimereactInputControl';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

export const PrimereactEnumArraySelectRenderer = (
  props
: ControlProps & OwnPropsOfEnum & TranslateProps & DispatchPropsOfMultiEnumControl) => {
  const {
    id,
    schema,
    visible,
    errors,
    path,
    options,
    data,
    addItem,
    removeItem,
    handleChange: _handleChange,
  
    enabled,
    label,
    config,
    required,
    uischema,
    
    ...otherProps
  } = props;

  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  
  const divClassNames = ['validate']
    .concat(isValid ? 'input-description' : 'validation_error')
    .join(' ');

  let newProps = {
    ...props,
    handleChange: (_childPath: any, newValue: any) => {
      _handleChange(path, newValue);
      /*
      (data || []).forEach((p: any) => {
        removeItem ? removeItem(path, p) : null;
      });

      if (newValue) {
        newValue.forEach((p: any) => {
          addItem(path, p);
        });
      }
      */
    } 
  }

  return (
    <PrimereactInputControl {...newProps} input={PrimereactMultiSelect} />
  );
};

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema): boolean =>
  (schema.type === 'string' || schema.type === 'integer')  && schema.enum !== undefined;

export const primereactEnumArraySelectRendererTester: RankedTester = rankWith(
  6,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches(
        schema =>
          hasType(schema, 'array') &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches('items', (schema) => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      }),
      optionIs('format', 'dropdown')
    )
  )
);

export default withJsonFormsMultiEnumProps(withTranslateProps(PrimereactEnumArraySelectRenderer));