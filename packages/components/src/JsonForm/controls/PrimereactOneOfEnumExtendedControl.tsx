import React from 'react';
import {
  and,
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  schemaMatches
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsOneOfEnumProps,
  withTranslateProps
} from '@jsonforms/react';
import merge from 'lodash/merge';

import { PrimereactInputControl } from '@scalargis/jsonforms-primereact-renderers';
import { PrimereactSelectExtended } from '../primereact-controls/PrimereactSelectExtended';


export const PrimereactOneOfEnumExtendedControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => {
  const { config, uischema, errors } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;

  return appliedUiSchemaOptions.autocomplete === false ? (
    <PrimereactInputControl {...props} input={PrimereactSelectExtended} />
  ) : (
    // TODO - autocomplete control
    <PrimereactInputControl {...props} input={PrimereactSelectExtended} />
  );
};

export const primereactOneOfEnumExtendedControlTester: RankedTester = rankWith(
  6,
  and(isOneOfEnumControl, schemaMatches((schema) => schema.hasOwnProperty('dependent_controls'))),
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(
  withTranslateProps(React.memo(PrimereactOneOfEnumExtendedControl)),
  false
);