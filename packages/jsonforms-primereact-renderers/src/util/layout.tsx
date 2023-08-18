import isEmpty from 'lodash/isEmpty';
import React, { ComponentType } from 'react';
import Ajv from 'ajv';
import type { UISchemaElement } from '@jsonforms/core';
import {
  getAjv,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
} from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';
//import { Grid, Hidden } from '@mui/material';

export const renderLayoutElements = (
  elements: UISchemaElement[],
  //schema: JsonSchema,
  schema: JsonSchema | undefined,
  //path: string,
  path: string | undefined,
  //enabled: boolean,
  enabled: boolean | undefined,
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) => {
  return elements.map((child, index) => (
    <div key={`${path}-${index}`}>
      <JsonFormsDispatch
        uischema={child}
        schema={schema}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
    </div>
  ));  
  /*
  return elements.map((child, index) => (
    <Grid item key={`${path}-${index}`} xs>
      <JsonFormsDispatch
        uischema={child}
        schema={schema}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
    </Grid>
  ));
  */
};

export interface PrimereactLayoutRendererProps extends OwnPropsOfRenderer {
  elements: UISchemaElement[];
  direction: 'row' | 'column';
}
const PrimereactLayoutRendererComponent = ({
  visible,
  elements,
  schema,
  path,
  enabled,
  direction,
  renderers,
  cells,
}: PrimereactLayoutRendererProps) => {
  if (isEmpty(elements)) {
    return null;
  } else {
    if (direction === 'row') {
      return (
        <div className="p-fluid p-formgrid p-grid p-jsonform"> 
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
    /*
    return (
      <Hidden xsUp={!visible}>
        <Grid
          container
          direction={direction}
          spacing={direction === 'row' ? 2 : 0}
        >
          {renderLayoutElements(
            elements,
            schema,
            path,
            enabled,
            renderers,
            cells
          )}
        </Grid>
      </Hidden>
    );
    */
  }
};
export const PrimereactLayoutRenderer = React.memo(
  PrimereactLayoutRendererComponent
);

export interface AjvProps {
  //ajv: Ajv;
  ajv: any;
}

// TODO fix @typescript-eslint/ban-types
// eslint-disable-next-line @typescript-eslint/ban-types
export const withAjvProps = <P extends {}>(
  Component: ComponentType<AjvProps & P>
) =>
  function WithAjvProps(props: P) {
    const ctx = useJsonForms();
    const ajv = getAjv({ jsonforms: { ...ctx } });

    return <Component {...props} ajv={ajv} />;
  };

export interface PrimereactLabelableLayoutRendererProps
  extends PrimereactLayoutRendererProps {
  label?: string;
}