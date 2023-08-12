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
import { PrimereactRadioGroup } from '../primereact-controls/PrimereactRadioGroup';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactOneOfRadioGroupControl = (props) => {
  return <PrimereactInputControl {...props} input={PrimereactRadioGroup} />
};

export const primereactOneOfRadioGroupControlTester = rankWith(
  20,
  and(isOneOfEnumControl, optionIs('format', 'radio'))
);

export default withJsonFormsOneOfEnumProps(PrimereactOneOfRadioGroupControl);