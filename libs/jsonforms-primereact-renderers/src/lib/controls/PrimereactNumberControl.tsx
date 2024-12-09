import React from 'react';
import {
  ControlProps,
  isNumberControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
/*
import { MuiInputNumber } from '../mui-controls/MuiInputNumber';
import { MaterialInputControl } from './MaterialInputControl';
*/
import { PrimereactInputNumber } from '../primereact-controls/PrimereactInputNumber';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const PrimereactNumberControl = (props: ControlProps) => (
  <PrimereactInputControl {...props} input={PrimereactInputNumber} />
);

export const primereactNumberControlTester: RankedTester = rankWith(
  2,
  isNumberControl
);

export default withJsonFormsControlProps(PrimereactNumberControl);