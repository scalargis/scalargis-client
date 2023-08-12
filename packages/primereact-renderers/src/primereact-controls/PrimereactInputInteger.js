import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
import { InputNumber } from 'primereact/inputnumber';
import merge from 'lodash/merge';

export const PrimereactInputInteger = React.memo(
  (props) => {
    const {
      data,
      id,
      enabled,
      isValid,
      uischema,
      path,
      handleChange,
      config
    } = props;
    
    const inputProps = { step: '1' };
    
    const toNumber = (value) =>
      value === '' || value === undefined || value === null ? null : parseInt(value, 10);
    
    const appliedUiSchemaOptions = merge({}, config, uischema.options);

    const className = ['validate']
      .concat(isValid ? 'valid select' : 'invalid select')
      .join(' ');


    return (
      <InputNumber
        value={data !== '' && data !== undefined && data !== null ? data : null} 
        inputId={id}
        onChange={ev => handleChange(path, toNumber(ev.value))}
        className={className}
        disabled={!enabled}
      />
    );

    /*
    return (
      <Input
        type='number'
        value={data !== undefined && data !== null ? data : ''}
        onChange={ev => handleChange(path, toNumber(ev.target.value))}
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        inputProps={inputProps}
        fullWidth={true}
      />
    );
    */
  },
  areEqual
);