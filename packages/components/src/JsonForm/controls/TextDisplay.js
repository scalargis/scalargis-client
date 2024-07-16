/*
Simple component for displaying text information in JSON Forms
*/

import { JsonSchema, UISchemaElement, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';


const TextDisplay = (props) => {
  const { uischema, visible } = props;
  return visible ? (
    <div>{uischema.text}</div>
  ) : null;
};

export default withJsonFormsControlProps(TextDisplay);

export const textDisplayTester = rankWith(
  4, //increase rank as needed
  uiTypeIs('Text')
);