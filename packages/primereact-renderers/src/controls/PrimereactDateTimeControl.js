import React from 'react';
import {
  ControlProps,
  isDateTimeControl,
  RankedTester,
  rankWith
} from '@jsonforms/core';
import { PrimereactInputDateTime } from '../primereact-controls/PrimereactInputDateTime';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const PrimereactDateTimeControl = (props) => (  
  <PrimereactInputControl {...props} input={PrimereactInputDateTime} />
);
export const primereactDateTimeControlTester = rankWith(
  2,
  isDateTimeControl
);
export default withJsonFormsControlProps(PrimereactDateTimeControl);