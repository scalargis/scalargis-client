import React from 'react';
import {
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsOneOfEnumProps } from '@jsonforms/react';

import { PrimereactSelect } from '../primereact-controls/PrimereactSelect';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactOneOfEnumControl = (props) => {
    return (
    <PrimereactInputControl {...props} input={PrimereactSelect} />
    );
  };

export const primereactOneOfEnumControlTester = rankWith(
  5,
  isOneOfEnumControl
);

export default withJsonFormsOneOfEnumProps(PrimereactOneOfEnumControl);