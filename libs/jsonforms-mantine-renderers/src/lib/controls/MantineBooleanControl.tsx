import {
  isBooleanControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineCheckbox } from '../mantine-controls/MantineCheckbox';
import { MantineInputControl } from './MantineInputControl';

export const MantineBooleanControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineCheckbox} />
);

export const mantineBooleanControlTester: RankedTester = rankWith(2, isBooleanControl);

export default withJsonFormsControlProps(MantineBooleanControl);
