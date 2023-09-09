import React from 'react';
import { LabelProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLabelProps } from '@jsonforms/react';
//import { Hidden, Typography } from '@mui/material';

/**
 * Default tester for a label.
 * @type {RankedTester}
 */
export const primereactLabelRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Label')
);

/**
 * Default renderer for a label.
 */
export const PrimereactLabelRenderer = ({ text, visible }: LabelProps) => {
  return (
    <h4>{text}</h4>
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <Typography variant='h6'>{text}</Typography>
    </Hidden>
  );
  */
};

export default withJsonFormsLabelProps(PrimereactLabelRenderer);