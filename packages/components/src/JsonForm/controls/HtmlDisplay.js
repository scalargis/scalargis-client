/*
Simple component for displaying text information in JSON Forms
*/

import { JsonSchema, UISchemaElement, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

const HtmlDisplay = (props) => {
  const { uischema, visible } = props;
  return visible ? (
    <div dangerouslySetInnerHTML={{__html: uischema.text}} />
  ) : null;
};

export default withJsonFormsControlProps(HtmlDisplay);

export const htmlDisplayTester = rankWith(
  4, //increase rank as needed
  uiTypeIs('Html')
);