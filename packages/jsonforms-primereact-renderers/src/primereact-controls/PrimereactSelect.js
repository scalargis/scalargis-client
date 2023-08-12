import React from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { Dropdown } from 'primereact/dropdown';
import { areEqual } from '@jsonforms/react';
import merge from 'lodash/merge';


export const PrimereactSelect = React.memo((props) => {
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

  /*
  return (
    <Select
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      value={data || ''}
      onChange={ev => handleChange(path, ev.target.value)}
      fullWidth={true}
    >
      {[<MenuItem value='' key={'empty'} />].concat(
        options.map(optionValue => (
          <MenuItem value={optionValue.value} key={optionValue.value}>
            {optionValue.label}
          </MenuItem>
        ))
      )}
    </Select>
  );
  */

  return(
    <Dropdown
      className={className}
      inputId={id}
      value={data || ''}
      options={options} 
      onChange={ev => handleChange(path, ev.target.value)} 
      placeholder="Selecione um valor"
      showClear={!required && data} />
  );
}, areEqual);