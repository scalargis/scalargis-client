import React from 'react';
import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsEnumProps } from '@jsonforms/react';
import { PrimereactSelect } from '../primereact-controls/PrimereactSelect';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactEnumControl = (props) => (
  <PrimereactInputControl {...props} input={PrimereactSelect} />
);

export const primereactEnumControlTester = rankWith(
  2,
  isEnumControl
);

export default withJsonFormsEnumProps(PrimereactEnumControl);