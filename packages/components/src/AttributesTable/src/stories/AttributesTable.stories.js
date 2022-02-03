import React from 'react';

import AttributesTable from '../Main';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/nova/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './stories.css';

export default {
  component: AttributesTable,
  title: 'AttributesTable',
};

const Template = args => <AttributesTable {...args} />

export const Default = Template.bind({});
Default.args = {
  open: true,
  as: '',
  onOpen: () => console.log('open'),
  onClose: () => console.log('close'),
  fields: [
    { name: 'id', label: 'ID' },
    { name: 'label', label: 'Etiqueta' },
    { name: 'url', label: 'URL', type: 'url' }
  ],
  data: [
    { id: '1', label: 'Google', url: 'https://google.com' },
    { id: '2', label: 'Sapo', url: 'https://sapo.pt' },
    { id: '3', label: 'Record', url: 'https://record.pt' },
    { id: '4', label: 'Secret', url: 'https://www.pinterest.pt/kimclampitt/erotic-pin-ups-adult/' }
  ]
};
