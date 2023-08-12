import React from 'react';
import {
  ControlProps,
  isNumberControl,
  RankedTester,
  rankWith
} from '@jsonforms/core';
import { PrimereactInputNumber } from '../primereact-controls/PrimereactInputNumber';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const PrimereactNumberControl = (props) => (
  <PrimereactInputControl {...props} input={PrimereactInputNumber} />
);

export const primereactNumberControlTester = rankWith(
  2,
  isNumberControl
);

export default withJsonFormsControlProps(PrimereactNumberControl);