import React from 'react';
import {
  and,
  ControlProps,
  isOneOfEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  schemaMatches
} from '@jsonforms/core';
import {
  TranslateProps,
  withJsonFormsOneOfEnumProps,
  withTranslateProps
} from '@jsonforms/react';

import { MantineInputControl } from '@scalargis/jsonforms-mantine-renderers';
import { MantineSelectExtended } from '../mantine-controls/MantineSelectExtended';


export const MantineOneOfEnumExtendedControl = (
  props: ControlProps & OwnPropsOfEnum & TranslateProps
) => <MantineInputControl {...props} input={MantineSelectExtended} />;

export const mantineOneOfEnumExtendedControlTester: RankedTester = rankWith(
  6,
  and(isOneOfEnumControl, schemaMatches((schema) => Object.prototype.hasOwnProperty.call(schema, 'dependent_controls'))),
);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export default withJsonFormsOneOfEnumProps(
  withTranslateProps(React.memo(MantineOneOfEnumExtendedControl)),
  false
);
