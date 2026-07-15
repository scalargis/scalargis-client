import {
  and,
  isBooleanControl,
  optionIs,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineToggle } from '../mantine-controls/MantineToggle';
import { MantineInputControl } from './MantineInputControl';

export const MantineBooleanToggleControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineToggle} />
);

export const mantineBooleanToggleControlTester: RankedTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true))
);

export default withJsonFormsControlProps(MantineBooleanToggleControl);
