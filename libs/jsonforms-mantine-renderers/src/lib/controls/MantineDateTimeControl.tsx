import {
  isDateTimeControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineInputDateTime } from '../mantine-controls/MantineInputDateTime';
import { MantineInputControl } from './MantineInputControl';

export const MantineDateTimeControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineInputDateTime} />
);

export const mantineDateTimeControlTester: RankedTester = rankWith(2, isDateTimeControl);

export default withJsonFormsControlProps(MantineDateTimeControl);
