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
  optionIs,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs
} from '@jsonforms/core';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import { PrimereactCheckbox } from '../primereact-controls';
import { PrimereactMultiSelect } from '../primereact-controls';
import { PrimereactInputControl } from '../controls/PrimereactInputControl';
import { startCase } from 'lodash';
import { isEmpty } from 'lodash';
import React from 'react';

export const PrimereactEnumArraySelectRenderer = (props) => {
  const {
    id,
    schema,
    visible,
    errors,
    path,
    options,
    data,
    addItem,
    removeItem
  } = props;

  let newProps = {
    ...props,
    handleChange: (_childPath, newValue) => {
      (data || []).forEach(p => {
        removeItem(path, p);
      });

      if (newValue) {
        newValue.forEach(p => {
          addItem(path, p);
        });
      }
    } 
  }

  return (
    <PrimereactInputControl {...newProps} input={PrimereactMultiSelect} />
  );
};

const hasOneOfItems = (schema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf).every((entry) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema) =>
  schema.type === 'string' && schema.enum !== undefined;

export const primereactEnumArraySelectRendererTester = rankWith(
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
      schemaSubPathMatches('items', schema => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      }),
      optionIs('format', 'select')
    )
  )
);

export default withJsonFormsMultiEnumProps(PrimereactEnumArraySelectRenderer);