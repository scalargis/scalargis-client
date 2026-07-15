import {
  and,
  isOneOfEnumControl,
  optionIs,
  rankWith,
  type ControlProps,
  type OwnPropsOfEnum,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsOneOfEnumProps } from '@jsonforms/react';

import { MantineRadioGroup } from '../mantine-controls/MantineRadioGroup';
import { MantineInputControl } from './MantineInputControl';

export const MantineOneOfRadioGroupControl = (
  props: ControlProps & OwnPropsOfEnum
) => <MantineInputControl {...props} input={MantineRadioGroup} />;

export const mantineOneOfRadioGroupControlTester: RankedTester = rankWith(
  21,
  and(isOneOfEnumControl, optionIs('format', 'radio'))
);

export default withJsonFormsOneOfEnumProps(MantineOneOfRadioGroupControl);
