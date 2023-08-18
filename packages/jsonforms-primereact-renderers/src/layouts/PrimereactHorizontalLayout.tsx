import React from 'react';
import {
  HorizontalLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import {
  PrimereactLayoutRenderer,
  PrimereactLayoutRendererProps,
} from '../util/layout';

/**
 * Default tester for a horizontal layout.
 * @type {RankedTester}
 */
export const primereactHorizontalLayoutTester: RankedTester = rankWith(
  2,
  uiTypeIs('HorizontalLayout')
);

export const PrimereactHorizontalLayoutRenderer = ({
  uischema,
  renderers,
  cells,
  schema,
  path,
  enabled,
  visible,
}: LayoutProps) => {
  const layout = uischema as HorizontalLayout;
  const childProps: PrimereactLayoutRendererProps = {
    elements: layout.elements,
    schema,
    path,
    enabled,
    direction: 'row',
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

export default withJsonFormsLayoutProps(PrimereactHorizontalLayoutRenderer);