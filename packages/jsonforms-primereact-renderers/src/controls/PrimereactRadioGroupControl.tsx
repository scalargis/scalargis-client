import React from 'react';
import {
  and,
  ControlProps,
  isEnumControl,
  optionIs,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsEnumProps } from '@jsonforms/react';
//import { MaterialRadioGroup } from './MaterialRadioGroup';
import { PrimereactRadioGroup } from '../primereact-controls/PrimereactRadioGroup';
import { PrimereactInputControl } from './PrimereactInputControl';


export const PrimereactRadioGroupControl = (
  props: ControlProps & OwnPropsOfEnum
) => {
  return <PrimereactInputControl {...props} input={PrimereactRadioGroup} />
  //return <PrimereactRadioGroup {...props} />;
};

export const primereactRadioGroupControlTester: RankedTester = rankWith(
  20,
  and(isEnumControl, optionIs('format', 'radio'))
);
export default withJsonFormsEnumProps(PrimereactRadioGroupControl);