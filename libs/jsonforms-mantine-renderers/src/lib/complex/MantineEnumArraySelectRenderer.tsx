import {
  and,
  hasType,
  optionIs,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  type ControlProps,
  type DispatchPropsOfMultiEnumControl,
  type JsonSchema,
  type OwnPropsOfEnum,
  type RankedTester,
} from '@jsonforms/core';
import {
  withJsonFormsMultiEnumProps,
  withTranslateProps,
  type TranslateProps,
} from '@jsonforms/react';

import { MantineMultiSelect } from '../mantine-controls/MantineMultiSelect';
import { MantineInputControl } from '../controls/MantineInputControl';

/** Same schema shape as MantineEnumArrayRenderer plus
 *  `options.format: 'dropdown'` → MultiSelect with pills. */
export const MantineEnumArraySelectRenderer = (
  props: ControlProps &
    OwnPropsOfEnum &
    TranslateProps &
    DispatchPropsOfMultiEnumControl
) => <MantineInputControl {...props} input={MantineMultiSelect} />;

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry) => entry.const !== undefined);

const hasEnumItems = (schema: JsonSchema): boolean =>
  (schema.type === 'string' || schema.type === 'integer') &&
  schema.enum !== undefined;

export const mantineEnumArraySelectRendererTester: RankedTester = rankWith(
  6,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches(
        (schema) =>
          hasType(schema, 'array') &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches('items', (schema) => hasOneOfItems(schema) || hasEnumItems(schema)),
      optionIs('format', 'dropdown')
    )
  )
);

export default withJsonFormsMultiEnumProps(
  withTranslateProps(MantineEnumArraySelectRenderer)
);
