import {
  isRangeControl,
  rankWith,
  type ControlProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { MantineSlider } from '../mantine-controls/MantineSlider';
import { MantineInputControl } from './MantineInputControl';

export const MantineSliderControl = (props: ControlProps) => (
  <MantineInputControl {...props} input={MantineSlider} />
);

export const mantineSliderControlTester: RankedTester = rankWith(4, isRangeControl);

export default withJsonFormsControlProps(MantineSliderControl);
