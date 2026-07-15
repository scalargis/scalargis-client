import {
  rankWith,
  uiTypeIs,
  type LayoutProps,
  type RankedTester,
  type VerticalLayout,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

import {
  MantineLayoutRenderer,
  type MantineLayoutRendererProps,
} from '../util/layout';

export const mantineVerticalLayoutTester: RankedTester = rankWith(
  3,
  uiTypeIs('VerticalLayout')
);

export const MantineVerticalLayoutRenderer = ({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
}: LayoutProps) => {
  const verticalLayout = uischema as VerticalLayout;
  const childProps: MantineLayoutRendererProps = {
    elements: verticalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible,
  };

  return <MantineLayoutRenderer {...childProps} renderers={renderers} cells={cells} />;
};

export default withJsonFormsLayoutProps(MantineVerticalLayoutRenderer);
