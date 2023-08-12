import React from 'react';
import {
  ControlProps,
  isDateControl,
  RankedTester,
  rankWith
} from '@jsonforms/core';
import { PrimereactInputDate } from '../primereact-controls/PrimereactInputDate';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const PrimereactDateControl = (props) => (  
  <PrimereactInputControl {...props} input={PrimereactInputDate} />
);
export const primereactDateControlTester = rankWith(
  2,
  isDateControl
);
export default withJsonFormsControlProps(PrimereactDateControl);