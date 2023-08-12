import React from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
import {Checkbox} from 'primereact/checkbox';
import merge from 'lodash/merge';


export const PrimereactCheckbox = React.memo((props) => {
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
  
  const inputProps = { autoFocus: !!appliedUiSchemaOptions.focus };
  
  // !! causes undefined value to be converted to false, otherwise has no effect
  const checked = !!data;
  
  const className = ['validate']
    .concat(isValid ? 'valid select' : 'invalid select')
    .join(' ');

  return (
    <Checkbox
      checked={checked}
      inputId={id}
      disabled={!enabled}
      onChange={e => handleChange(path, e.checked)}      
      className={className}
    />
  );
  /*
  return (
    <Checkbox
      checked={checked}
      onChange={(_ev, isChecked) => handleChange(path, isChecked)}
      className={className}
      id={id}
      disabled={!enabled}
      inputProps={inputProps}
    />
  );
  */
}, areEqual);