import React from 'react';

import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { primereactRenderers } from '../index';
import { JsonForms } from '@jsonforms/react';

import schema from "./schema.json";
import uisample from "./uischema.json";
import data from "./data.json"

import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/nova/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
//import './stories.css';

const renderers = [
//  ...vanillaRenderers,
  ...primereactRenderers
];


export default {
  component: JsonForms,
  title: 'HorizontalLayout',
};

const Template = args => <JsonForms {...args} onChange={({ errors, data }) => {/*console.log(data);*/}} />

const uischema = {...uisample}//, type: "HorizontalLayout"};

export const Default = Template.bind({});
Default.args = {
  schema: schema,
  uischema: uischema,
  data: data,
  renderers: renderers,
  cells: vanillaCells,
};
