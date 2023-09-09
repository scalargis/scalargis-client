import React from 'react';
import {
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
//import { MuiInputText } from '../mui-controls/MuiInputText';
//import { MaterialInputControl } from './MaterialInputControl';
import { PrimereactInputText } from '../primereact-controls/PrimereactInputText';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactTextControl = (props: ControlProps) => (
  <PrimereactInputControl {...props} input={PrimereactInputText} />
);

export const primereactTextControlTester: RankedTester = rankWith(
  //1,
  2,
  isStringControl
);
export default withJsonFormsControlProps(PrimereactTextControl);