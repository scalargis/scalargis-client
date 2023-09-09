import React from 'react';
import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsEnumProps,
  withTranslateProps,
} from '@jsonforms/react';
//import { MuiSelect } from '../mui-controls/MuiSelect';
import { PrimereactSelect } from '../primereact-controls/PrimereactSelect';
import merge from 'lodash/merge';
//import { MaterialInputControl } from './MaterialInputControl';
import { PrimereactInputControl } from './PrimereactInputControl';
/*
import {
  MuiAutocomplete,
  WithOptionLabel,
} from '../mui-controls/MuiAutocomplete';
*/

export const PrimereactEnumControl = (
//  props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => {
  const { config, uischema, errors } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;

  return appliedUiSchemaOptions.autocomplete === false ? (
    <PrimereactInputControl {...props} input={PrimereactSelect} />
  ) : (
    <PrimereactInputControl {...props} input={PrimereactSelect} />
  );  
  /*
  return appliedUiSchemaOptions.autocomplete === false ? (
    <MaterialInputControl {...props} input={MuiSelect} />
  ) : (
    <MuiAutocomplete {...props} isValid={isValid} />
  );
  */
};

export const primereactEnumControlTester: RankedTester = rankWith(
  2,
  isEnumControl
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(
  withTranslateProps(React.memo(PrimereactEnumControl)),
  false
);