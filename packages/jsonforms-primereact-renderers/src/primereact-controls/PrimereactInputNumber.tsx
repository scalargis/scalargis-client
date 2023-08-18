import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
//import { Input } from '@mui/material';
import { InputNumber } from 'primereact/inputnumber';
import merge from 'lodash/merge';
//import { useDebouncedChange } from '../util';

const toNumber = (value: string) =>
  value === '' ? undefined : parseFloat(value);
const eventToValue = (ev: any) => toNumber(ev.target.value);

export const PrimereactInputNumber = React.memo(function PrimereactInputNumber(
  props: CellProps & WithClassname
) {
  const { data, className, id, enabled, uischema, isValid, path, handleChange, config } =
    props;
  //const inputProps = { step: '0.1' };

  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
  const [inputValue, onChange] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );
  */

  return (
    <InputNumber 
      //value={data !== '' && data !== undefined && data !== null ? data : null}
      value={data !== '' ? data : undefined}
      inputId={id}
      //onChange={(e) => onChange}
      onChange={(ev) => {
        const newVal = ev.value != null ? ev.value : undefined;
        handleChange(path, newVal);
      }}      
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      disabled={!enabled}
      mode="decimal"
      step={0.1}
      maxFractionDigits={10}
    />
  );  
  /*
  return (
    <Input
      type='number'
      value={inputValue}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      inputProps={inputProps}
      fullWidth={true}
    />
  );
  */
});