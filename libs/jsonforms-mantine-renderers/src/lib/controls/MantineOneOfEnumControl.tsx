import { memo } from 'react';
import {
  isOneOfEnumControl,
  rankWith,
  type ControlProps,
  type OwnPropsOfEnum,
  type RankedTester,
} from '@jsonforms/core';
import {
  withJsonFormsOneOfEnumProps,
  withTranslateProps,
  type TranslateProps,
} from '@jsonforms/react';

import { MantineSelect } from '../mantine-controls/MantineSelect';
import { MantineInputControl } from './MantineInputControl';

export const MantineOneOfEnumControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => <MantineInputControl {...props} input={MantineSelect} />;

export const mantineOneOfEnumControlTester: RankedTester = rankWith(
  5,
  isOneOfEnumControl
);

export default withJsonFormsOneOfEnumProps(
  withTranslateProps(memo(MantineOneOfEnumControl)),
  false
);
