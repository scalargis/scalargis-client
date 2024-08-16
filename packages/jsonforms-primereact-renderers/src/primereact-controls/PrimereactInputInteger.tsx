import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
//import { Input } from '@mui/material';
import { InputNumber } from 'primereact/inputnumber';
import merge from 'lodash/merge';
//import { useDebouncedChange } from '../util';

/*
const toNumber = (value: string) =>
  value === '' ? undefined : parseInt(value, 10);
const eventToValue = (ev: any) => toNumber(ev.value); //const eventToValue = (ev: any) => ev.value;
*/

export const PrimereactInputInteger = React.memo(function MuiInputInteger(
  props: CellProps & WithClassname
) {
  const { data, className, id, enabled, uischema, isValid, path, handleChange, config } =
    props;
  const inputProps = { step: '1' };

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
      //value={inputValue !== '' ? inputValue : undefined}
      value={data !== '' ? data : undefined}
      inputId={id}
      //onChange={(e) => onChange}
      onChange={(ev) => {
        const newVal = ev.value != null ? ev.value : undefined;
        handleChange(path, newVal);
      }}
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      format={ uischema?.options?.formatNumber === false ? false : true }
      disabled={!enabled}
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

/*
import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
//import { Input } from '@mui/material';
import { InputNumber } from 'primereact/inputnumber';
import merge from 'lodash/merge';
import { useDebouncedChange } from '../util';

const toNumber = (value: string) =>
  value === '' ? undefined : parseInt(value, 10);
const eventToValue = (ev: any) => toNumber(ev.target.value);


export const MuiInputInteger = React.memo(function PrimereactInputInteger(
  props: CellProps & WithClassname
) {
  const { data, className, id, enabled, uischema, path, handleChange, config } =
    props;
  const inputProps = { step: '1' };

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const [inputValue, onChange] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );
  
  return (
    <InputNumber
      value={inputValue !== '' ? inputValue : undefined}
      inputId={id}
      onChange={onChange}
      className={className}
      disabled={!enabled}
    />
  );
});
*/