import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
//import { Switch, InputProps } from '@mui/material';
import {InputSwitch} from 'primereact/inputswitch';
import merge from 'lodash/merge';

/*
interface MuiToggleInputProps {
  inputProps?: InputProps['inputProps'];
}
*/

export const PrimereactToggle = React.memo(function PrimereactToggle(
//  props: CellProps & WithClassname & MuiToggleInputProps
  props: CellProps & WithClassname
) {
  const {
    data,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    config,
    //inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
  const inputPropsMerged = merge({}, inputProps, {
    autoFocus: !!appliedUiSchemaOptions.focus,
  });
  */
  const checked = !!data;

  return (
    <InputSwitch 
      checked={checked} 
      inputId={id}
      disabled={!enabled}
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
      inputProps={inputPropsMerged}
    />
  );
  */
});