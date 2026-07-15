import { Divider } from '@mantine/core';
import {
  rankWith,
  uiTypeIs,
  type RankedTester,
  type StatePropsOfRenderer,
} from '@jsonforms/core';
import { withJsonFormsLabelProps } from '@jsonforms/react';

export const mantineDividerRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Divider')
);

/**
 * Custom 'Divider' uischema element (ScalarGIS extension, not upstream
 * JSONForms). Default is a horizontal rule — what a section break inside a
 * form means, and what the baseline procedure expects. The Prime renderer's
 * code default was 'vertical', which Prime CSS renders as an invisible
 * sliver outside a flex row; treat that as the bug, not the contract.
 * `options.layout` still forces either orientation.
 */
export const MantineDividerRenderer = ({
  visible,
  uischema,
}: StatePropsOfRenderer) => {
  const layout = uischema?.options?.['layout'] === 'vertical' ? 'vertical' : 'horizontal';
  return <Divider orientation={layout} my="xs" hidden={!visible} />;
};

export default withJsonFormsLabelProps(MantineDividerRenderer);
