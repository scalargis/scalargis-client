import React from 'react';
import {
  and,
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  schemaMatches
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsEnumProps,
  withTranslateProps
} from '@jsonforms/react';

import { MantineInputControl } from '@scalargis/jsonforms-mantine-renderers';
import { MantineSelectExtended } from '../mantine-controls/MantineSelectExtended';


export const MantineEnumExtendedControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => <MantineInputControl {...props} input={MantineSelectExtended} />;

export const mantineEnumExtendedControlTester: RankedTester = rankWith(
  3,
  and(isEnumControl, schemaMatches((schema) => Object.prototype.hasOwnProperty.call(schema, 'dependent_controls'))),
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsEnumProps(
  withTranslateProps(React.memo(MantineEnumExtendedControl)),
  false
);
