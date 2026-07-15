import {
  and,
  hasType,
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
import { withJsonFormsMultiEnumProps } from '@jsonforms/react';

import { MantineCheckboxGroup } from '../mantine-controls/MantineCheckboxGroup';
import { MantineInputControl } from '../controls/MantineInputControl';

/** uniqueItems array of enum/oneOf consts → checkbox list. The clear-on-hide
 *  behaviour the Prime renderer implemented locally comes from the shared
 *  MantineInputControl here. */
export const MantineEnumArrayRenderer = (
  props: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl
) => <MantineInputControl {...props} input={MantineCheckboxGroup} />;

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry) => entry.const !== undefined);

const hasEnumItems = (schema: JsonSchema): boolean =>
  (schema.type === 'string' || schema.type === 'integer') &&
  schema.enum !== undefined;

export const mantineEnumArrayRendererTester: RankedTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches(
        (schema) =>
          hasType(schema, 'array') &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches('items', (schema) => hasOneOfItems(schema) || hasEnumItems(schema))
    )
  )
);

export default withJsonFormsMultiEnumProps(MantineEnumArrayRenderer);
