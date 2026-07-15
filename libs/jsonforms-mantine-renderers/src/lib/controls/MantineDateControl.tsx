import {
  isDateControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineInputDate } from '../mantine-controls/MantineInputDate';
import { MantineInputControl } from './MantineInputControl';

export const MantineDateControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineInputDate} />
);

export const mantineDateControlTester: RankedTester = rankWith(4, isDateControl);

export default withJsonFormsControlProps(MantineDateControl);
