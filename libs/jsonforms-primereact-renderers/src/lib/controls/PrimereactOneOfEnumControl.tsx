import React from 'react';
import {
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsOneOfEnumProps,
  withTranslateProps,
} from '@jsonforms/react';
/*
import {
  MuiAutocomplete,
  WithOptionLabel,
} from '../mui-controls/MuiAutocomplete';
import { MuiSelect } from '../mui-controls/MuiSelect';
import { MaterialInputControl } from '../controls/MaterialInputControl';
*/
import { PrimereactSelect } from '../primereact-controls/PrimereactSelect';
import { PrimereactInputControl } from './PrimereactInputControl';
import merge from 'lodash/merge';

export const PrimereactOneOfEnumControl = (
//  props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => {
  const { config, uischema, errors } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;

  return appliedUiSchemaOptions.autocomplete === false ? (
    <PrimereactInputControl {...props} input={PrimereactSelect} />
  ) : (
    // TODO - autocomplete control
    <PrimereactInputControl {...props} input={PrimereactSelect} />
  );  
  /*
  return appliedUiSchemaOptions.autocomplete === false ? (
    <InputControl {...props} input={MuiSelect} />
  ) : (
    <MuiAutocomplete {...props} isValid={isValid} />
  );
  */
};

export const primereactOneOfEnumControlTester: RankedTester = rankWith(
  5,
  isOneOfEnumControl
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(
  withTranslateProps(React.memo(PrimereactOneOfEnumControl)),
  false
);