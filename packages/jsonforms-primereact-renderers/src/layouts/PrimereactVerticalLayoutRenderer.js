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
  //PrimereactLayoutRenderer,
  //PrimereactVLayoutRenderer,
  PrimereactLayoutRendererProps
} from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

/**
 * Default tester for a vertical layout.
 * @type {RankedTester}
 */
export const primereactVerticalLayoutTester = rankWith(
  3,
  uiTypeIs('VerticalLayout')
);

const PrimereactVerticalLayoutRendererComponent =
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
        <div className="p-fluid p-jsonform">          
          {renderLayoutElements(
            elements,
            schema,
            path,
            enabled,
            renderers,
            cells
          )}
        </div>
      );
    }
  };
export const PrimereactLayoutRenderer = React.memo(PrimereactVerticalLayoutRendererComponent);


export const PrimereactVerticalLayoutRenderer = ({ uischema, schema, path, enabled, visible, renderers, cells }) => {
  const verticalLayout = uischema;
    const childProps = {
    elements: verticalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible
  };
  return <PrimereactVerticalLayoutRendererComponent {...childProps} renderers={renderers} cells={cells} />;  
};

export default withJsonFormsLayoutProps(PrimereactVerticalLayoutRenderer);