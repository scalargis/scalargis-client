import {
  isStringControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineInputText } from '../mantine-controls/MantineInputText';
import { MantineInputControl } from './MantineInputControl';

export const MantineTextControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineInputText} />
);

export const mantineTextControlTester: RankedTester = rankWith(2, isStringControl);

export default withJsonFormsControlProps(MantineTextControl);
