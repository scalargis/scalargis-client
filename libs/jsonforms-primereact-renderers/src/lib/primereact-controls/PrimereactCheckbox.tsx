import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
//import { Checkbox, InputProps } from '@mui/material';
import {Checkbox} from 'primereact/checkbox';
import merge from 'lodash/merge';

/*
interface MuiCheckboxInputProps {
  inputProps?: InputProps['inputProps'];
}
*/
interface PrimereactCheckboxInputProps {
  inputProps?: any;
}

export const PrimereactCheckbox = React.memo(function PrimereactCheckbox(
  //props: CellProps & WithClassname & MuiCheckboxInputProps
  props: CellProps & WithClassname & PrimereactCheckboxInputProps
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
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const inputPropsMerged = merge({}, inputProps, {
    autoFocus: !!appliedUiSchemaOptions.focus,
  });
  // !! causes undefined value to be converted to false, otherwise has no effect
  const checked = !!data;

  return (
    <Checkbox
      checked={checked}
      inputId={id}
      disabled={!enabled}
      onChange={e => handleChange(path, e.checked)}      
      className={`p-mr-1 ${className}`}
      //inputProps={inputPropsMerged}
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
      inputProps={inputPropsMerged}
    />
  );
  */
});