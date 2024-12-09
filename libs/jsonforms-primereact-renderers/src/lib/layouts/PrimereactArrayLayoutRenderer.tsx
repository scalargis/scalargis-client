import React, { useCallback } from 'react';

import {
  ArrayLayoutProps,
  isObjectArrayWithNesting,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
//import { Hidden } from '@mui/material';
//import { MaterialArrayLayout } from './MaterialArrayLayout';
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react';

export const PrimereactArrayLayoutRenderer = ({
  visible,
  addItem,
  data,
  ...props
}: ArrayLayoutProps) => {
  const addItemCb = useCallback(
    (p: string, value: any) => addItem(p, value),
    [addItem]
  );

  //TODO
  return (
    <div>TODO: PrimereactArrayLayoutRenderer</div>
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <MaterialArrayLayout visible={visible} addItem={addItemCb} {...props} />
    </Hidden>
  );
  */
};

export const primereactArrayLayoutTester: RankedTester = rankWith(
  4,
  isObjectArrayWithNesting
);
export default withJsonFormsArrayLayoutProps(PrimereactArrayLayoutRenderer);