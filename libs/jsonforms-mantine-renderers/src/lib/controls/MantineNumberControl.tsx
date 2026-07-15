import {
  isNumberControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineInputNumber } from '../mantine-controls/MantineInputNumber';
import { MantineInputControl } from './MantineInputControl';

export const MantineNumberControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineInputNumber} />
);

export const mantineNumberControlTester: RankedTester = rankWith(2, isNumberControl);

export default withJsonFormsControlProps(MantineNumberControl);
