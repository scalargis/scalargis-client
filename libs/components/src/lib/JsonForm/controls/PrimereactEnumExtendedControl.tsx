import React from 'react';
import {
  and,
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  schemaMatches
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsEnumProps,
  withTranslateProps
} from '@jsonforms/react';
import merge from 'lodash/merge';

import { PrimereactInputControl } from '@scalargis/jsonforms-primereact-renderers';
import { PrimereactSelectExtended } from '../primereact-controls/PrimereactSelectExtended';


export const PrimereactEnumExtendedControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => {
  const { config, uischema, errors } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;

  return appliedUiSchemaOptions.autocomplete === false ? (
    <PrimereactInputControl {...props} input={PrimereactSelectExtended} />
  ) : (
    <PrimereactInputControl {...props} input={PrimereactSelectExtended} />
  );
};

export const primereactEnumExtendedControlTester: RankedTester = rankWith(
  3,
  and(isEnumControl, schemaMatches((schema) => schema.hasOwnProperty('dependent_controls'))),
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(
  withTranslateProps(React.memo(PrimereactEnumExtendedControl)),
  false
);