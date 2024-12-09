import React from 'react';
import {
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  VerticalLayout,
} from '@jsonforms/core';
import {
  PrimereactLayoutRenderer,
  PrimereactLayoutRendererProps,
} from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

/**
 * Default tester for a vertical layout.
 * @type {RankedTester}
 */
export const primereactVerticalLayoutTester: RankedTester = rankWith(
  3,
  uiTypeIs('VerticalLayout')
);

export const PrimereactVerticalLayoutRenderer = ({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
}: LayoutProps) => {
  const verticalLayout = uischema as VerticalLayout;
  const childProps: PrimereactLayoutRendererProps = {
    elements: verticalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible,
  };

  return (
    <PrimereactLayoutRenderer
      {...childProps}
      renderers={renderers}
      cells={cells}
    />
  );
};

export default withJsonFormsLayoutProps(PrimereactVerticalLayoutRenderer);