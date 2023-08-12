import React from 'react';
import isEmpty from 'lodash/isEmpty';
import {
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  VerticalLayout,
} from '@jsonforms/core';
import {
  renderLayoutElements,
  PrimereactLayoutRendererProps
} from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

/**
 * Default tester for a vertical layout.
 * @type {RankedTester}
 */
  export const primereactHorizontalLayoutTester = rankWith(
  3,
  uiTypeIs('HorizontalLayout')
);

const PrimereactHorizontalLayoutRendererComponent =
  ({
    visible,
    elements,
    schema,
    path,
    enabled,
    direction,
    renderers,
    cells
  }) => {
    if (isEmpty(elements)) {
      return null;
    } else {
      return (
          <div className="p-fluid p-formgrid p-grid p-jsonform">          
            {renderLayoutElements(
              elements,
              schema,
              path,
              enabled,
              renderers,
              cells,
              'p-col'
            )}
          </div>
      );
    }
  };
export const PrimereactLayoutRenderer = React.memo(PrimereactHorizontalLayoutRendererComponent);


export const PrimereactHorizontalLayoutRenderer = ({ uischema, schema, path, enabled, visible, renderers, cells }) => {
  const horizontalLayout = uischema;
    const childProps = {
    elements: horizontalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'row',
    visible
  };

  return <PrimereactHorizontalLayoutRendererComponent {...childProps} renderers={renderers} cells={cells} />;  
};

export default withJsonFormsLayoutProps(PrimereactHorizontalLayoutRenderer);