import React from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { MultiSelect } from 'primereact/multiselect';
import { areEqual } from '@jsonforms/react';
import merge from 'lodash/merge';


export const PrimereactMultiSelect = React.memo((props) => {
  const {
    data,
    id,
    enabled,
    required,
    isValid,
    uischema,
    path,
    handleChange,
    options,
    config
  } = props;
  
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  
  const className = ['validate']
    .concat(isValid ? 'valid select' : 'invalid select')
    .join(' ');

  return(
    <MultiSelect
      className={className}
      inputId={id}
      value={data || ''}
      options={options} 
      onChange={ev => handleChange(path, ev.value)} 
      placeholder="Selecione um ou mais valores"
      showClear={!required && data}
      display="chip"
    />
  );
}, areEqual);