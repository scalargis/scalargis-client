import React from 'react';
import {
  ControlProps,
  isIntegerControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
//import { MuiInputInteger } from '../mui-controls/MuiInputInteger';
import { PrimereactInputInteger } from '../primereact-controls/PrimereactInputInteger';
//import { MaterialInputControl } from './MaterialInputControl';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';


export const PrimereactIntegerControl = (props: ControlProps) => (
  <PrimereactInputControl {...props} input={PrimereactInputInteger} />
);
export const primereactIntegerControlTester: RankedTester = rankWith(
  2,
  isIntegerControl
);
export default withJsonFormsControlProps(PrimereactIntegerControl);


/*
export const PrimereactIntegerControl = (props) => (
  <PrimereactInputControl {...props} input={PrimereactInputInteger} />
);
export const primereactIntegerControlTester = rankWith(
  2,
  isIntegerControl
);
export default withJsonFormsControlProps(PrimereactIntegerControl);
*/