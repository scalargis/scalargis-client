import isEmpty from 'lodash/isEmpty';
import React from 'react';
//import { Card, CardContent, CardHeader, Hidden } from '@mui/material';
import { Card } from 'primereact/card';
import {
  GroupLayout,
  LayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  withIncreasedRank,
} from '@jsonforms/core';
/*
import {
  MaterialLabelableLayoutRendererProps,
  MaterialLayoutRenderer,
} from '../util/layout';
*/
import {
  PrimereactLabelableLayoutRendererProps,
  PrimereactLayoutRenderer,
} from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

export const groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));
const style: { [x: string]: any } = { marginBottom: '10px' };

const GroupComponent = React.memo(function GroupComponent({
  visible,
  enabled,
  uischema,
  label,
  ...props
//}: MaterialLabelableLayoutRendererProps) {
}: PrimereactLabelableLayoutRendererProps) {
  const groupLayout = uischema as GroupLayout;

  return (
    <Card title={label || ''} className="p-mb-2">
      <PrimereactLayoutRenderer
        {...props}
        visible={visible}
        enabled={enabled}
        elements={groupLayout.elements}
      />
    </Card>
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <Card style={style}>
        {!isEmpty(label) && <CardHeader title={label} />}
        <CardContent>
          <MaterialLayoutRenderer
            {...props}
            visible={visible}
            enabled={enabled}
            elements={groupLayout.elements}
          />
        </CardContent>
      </Card>
    </Hidden>
  );
  */
});

export const PrimereactGroupLayoutRenderer = ({
  uischema,
  schema,
  path,
  visible,
  enabled,
  renderers,
  cells,
  direction,
  label,
}: LayoutProps) => {
  const groupLayout = uischema as GroupLayout;

  return (
    <GroupComponent
      elements={groupLayout.elements}
      schema={schema}
      path={path}
      direction={direction}
      visible={visible}
      enabled={enabled}
      uischema={uischema}
      renderers={renderers}
      cells={cells}
      label={label}
    />
  );
};

export default withJsonFormsLayoutProps(PrimereactGroupLayoutRenderer);

export const primereactGroupTester: RankedTester = withIncreasedRank(
  1,
  groupTester
);