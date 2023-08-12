import React from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
import { RadioButton } from 'primereact/radiobutton';
import merge from 'lodash/merge';


export const PrimereactRadioGroup = React.memo((props) => {
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
  
  /*
  const className = ['validate']
    .concat(isValid ? 'valid select' : 'invalid option')
    .join(' ');
  */

  return (
    <React.Fragment>
    {
      options.map((option) => {
        return (
            <div key={option.value}>
              <RadioButton                
                value={option.value}
                inputId={`${id}-${option.value}`}
                name={id}
                onChange={(e) => handleChange(path, e.value)}
                checked={data === (option.value)}
                disabled={!enabled}
              />
              <label htmlFor={`${id}-${option.value}`}>{option.label}</label>
            </div>
        )
      })
    }
    </React.Fragment>
  );

}, areEqual);