import { memo } from 'react';
import {
  isEnumControl,
  rankWith,
  type ControlProps,
  type OwnPropsOfEnum,
  type RankedTester,
} from '@jsonforms/core';
import {
  withJsonFormsEnumProps,
  withTranslateProps,
  type TranslateProps,
} from '@jsonforms/react';

import { MantineSelect } from '../mantine-controls/MantineSelect';
import { MantineInputControl } from './MantineInputControl';

export const MantineEnumControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => <MantineInputControl {...props} input={MantineSelect} />;

export const mantineEnumControlTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(
  withTranslateProps(memo(MantineEnumControl)),
  false
);
