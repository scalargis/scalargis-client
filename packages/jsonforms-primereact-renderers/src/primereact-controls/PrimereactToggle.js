import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
import {InputSwitch} from 'primereact/inputswitch';
import merge from 'lodash/merge';

export const PrimereactToggle = React.memo((props) => {
  const {
    data,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    config
  } = props;
  
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  
  const inputProps = { autoFocus: !!appliedUiSchemaOptions.focus };
  
  const checked = !!data;

  return (
    <InputSwitch 
      checked={checked} 
      inputId={id}
      onChange={(e) => handleChange(path, e.value)} 
      className={className}
    />
  );

  /*
  return (
    <Switch
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