import {
  isIntegerControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineInputInteger } from '../mantine-controls/MantineInputInteger';
import { MantineInputControl } from './MantineInputControl';

export const MantineIntegerControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineInputInteger} />
);

export const mantineIntegerControlTester: RankedTester = rankWith(2, isIntegerControl);

export default withJsonFormsControlProps(MantineIntegerControl);
