import React from 'react';
import {
  ControlProps,
  isTimeControl,
  RankedTester,
  rankWith
} from '@jsonforms/core';
import { PrimereactInputTime } from '../primereact-controls/PrimereactInputTime';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const PrimereactTimeControl = (props) => (  
  <PrimereactInputControl {...props} input={PrimereactInputTime} />
);
export const primereactTimeControlTester = rankWith(
  3,
  isTimeControl
);
export default withJsonFormsControlProps(PrimereactTimeControl);