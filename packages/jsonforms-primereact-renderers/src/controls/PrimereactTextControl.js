import React from 'react';
import {
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { PrimereactInputText } from '../primereact-controls/PrimereactInputText';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactTextControl = (props) => (
  <PrimereactInputControl {...props} input={PrimereactInputText} />
);

export const primereactTextControlTester = rankWith(
  2,
  isStringControl
);
export default withJsonFormsControlProps(PrimereactTextControl);