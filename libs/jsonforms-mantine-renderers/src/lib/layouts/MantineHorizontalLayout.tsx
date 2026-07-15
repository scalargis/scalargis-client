import {
  rankWith,
  uiTypeIs,
  type HorizontalLayout,
  type LayoutProps,
  type RankedTester,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

import {
  MantineLayoutRenderer,
  type MantineLayoutRendererProps,
} from '../util/layout';

export const mantineHorizontalLayoutTester: RankedTester = rankWith(
  2,
  uiTypeIs('HorizontalLayout')
);

export const MantineHorizontalLayoutRenderer = ({
  uischema,
  renderers,
  cells,
  schema,
  path,
  enabled,
  visible,
}: LayoutProps) => {
  const layout = uischema as HorizontalLayout;
  const childProps: MantineLayoutRendererProps = {
    elements: layout.elements,
    schema,
    path,
    enabled,
    direction: 'row',
    visible,
  };

  return <MantineLayoutRenderer {...childProps} renderers={renderers} cells={cells} />;
};

export default withJsonFormsLayoutProps(MantineHorizontalLayoutRenderer);
