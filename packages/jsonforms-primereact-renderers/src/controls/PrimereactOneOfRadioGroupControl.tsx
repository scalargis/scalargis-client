import React from 'react';
import {
  and,
  ControlProps,
  isOneOfEnumControl,
  optionIs,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsOneOfEnumProps } from '@jsonforms/react';
//import { MaterialRadioGroup } from './MaterialRadioGroup';
import { PrimereactRadioGroup } from '../primereact-controls/PrimereactRadioGroup';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactOneOfRadioGroupControl = (
  props: ControlProps & OwnPropsOfEnum
) => {
  return <PrimereactInputControl {...props} input={PrimereactRadioGroup} />
  //return <MaterialRadioGroup {...props} />;
};

export const primereactOneOfRadioGroupControlTester: RankedTester = rankWith(
  //20,
  21,
  and(isOneOfEnumControl, optionIs('format', 'radio'))
);

export default withJsonFormsOneOfEnumProps(PrimereactOneOfRadioGroupControl);