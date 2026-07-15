import {
  and,
  isEnumControl,
  optionIs,
  rankWith,
  type ControlProps,
  type OwnPropsOfEnum,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsEnumProps } from '@jsonforms/react';

import { MantineRadioGroup } from '../mantine-controls/MantineRadioGroup';
import { MantineInputControl } from './MantineInputControl';

export const MantineRadioGroupControl = (props: ControlProps & OwnPropsOfEnum) => (
  <MantineInputControl {...props} input={MantineRadioGroup} />
);

export const mantineRadioGroupControlTester: RankedTester = rankWith(
  20,
  and(isEnumControl, optionIs('format', 'radio'))
);

export default withJsonFormsEnumProps(MantineRadioGroupControl);
