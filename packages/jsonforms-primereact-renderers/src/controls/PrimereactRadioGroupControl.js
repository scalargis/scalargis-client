import React from 'react';
import {
  and,
  ControlProps,
  isEnumControl,
  optionIs, OwnPropsOfEnum, RankedTester, rankWith
} from '@jsonforms/core';
import {  withJsonFormsEnumProps } from '@jsonforms/react';
import { PrimereactRadioGroup } from '../primereact-controls/PrimereactRadioGroup';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactRadioGroupControl = (props) => {
   return <PrimereactInputControl {...props} input={PrimereactRadioGroup} />
};

export const primereactRadioGroupControlTester = rankWith(
  20,
  and(isEnumControl, optionIs('format', 'radio'))
);
export default withJsonFormsEnumProps(PrimereactRadioGroupControl);