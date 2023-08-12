import React from 'react';
import {
  ControlProps,
  isIntegerControl,
  RankedTester,
  rankWith
} from '@jsonforms/core';
import { PrimereactInputInteger } from '../primereact-controls/PrimereactInputInteger';
import { PrimereactInputControl } from './PrimereactInputControl';
import { withJsonFormsControlProps } from '@jsonforms/react';

export const PrimereactIntegerControl = (props) => (
  <PrimereactInputControl {...props} input={PrimereactInputInteger} />
);
export const primereactIntegerControlTester = rankWith(
  2,
  isIntegerControl
);
export default withJsonFormsControlProps(PrimereactIntegerControl);