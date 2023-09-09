import React from 'react';
import { StatePropsOfRenderer, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLabelProps } from '@jsonforms/react';
import { Divider } from 'primereact/divider';

/**
 * Default tester for a divider.
 * @type {RankedTester}
 */
export const primereactDividerRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Divider')
);

/**
 * Default renderer for a divider.
 */
export const PrimereactDividerRenderer = ({ visible, uischema }: StatePropsOfRenderer) => {
  const layout = uischema?.options?.layout || 'vertical';
  return (
    <Divider layout={layout} />
  );
};

export default withJsonFormsLabelProps(PrimereactDividerRenderer);