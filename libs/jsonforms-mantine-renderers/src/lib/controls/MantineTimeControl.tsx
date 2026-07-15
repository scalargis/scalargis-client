import {
  isTimeControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineInputTime } from '../mantine-controls/MantineInputTime';
import { MantineInputControl } from './MantineInputControl';

export const MantineTimeControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineInputTime} />
);

export const mantineTimeControlTester: RankedTester = rankWith(4, isTimeControl);

export default withJsonFormsControlProps(MantineTimeControl);
