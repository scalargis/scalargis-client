import React, { useState } from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
import { InputText } from 'primereact/inputtext';
import {Password} from 'primereact/password';
import merge from 'lodash/merge';


export const PrimereactInputText = React.memo((props) => {
  const [showAdornment, setShowAdornment] = useState(false);
  const {
    data,
    config,
    id,
    enabled,
    uischema,
    isValid,
    path,
    handleChange,
    schema,
    muiInputProps,
    inputComponent
  } = props;
  
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  
  let inputProps;
  if (appliedUiSchemaOptions.restrict) {
    inputProps = { maxLength: maxLength };
  } else {
    inputProps = {};
  }

  inputProps = merge(inputProps, muiInputProps);

  if (appliedUiSchemaOptions.trim && maxLength !== undefined) {
    inputProps.size = maxLength;
  }

  const className = ['validate']
    .concat(isValid ? 'valid' : 'invalid')
    .concat('input')
    .join(' ');

  const onChange = (ev) => handleChange(path, ev.target.value);

  if (appliedUiSchemaOptions.format === 'password') {
    return (
      <Password
        className={className}
        value={data || ''}
        inputId={id}
        onChange={onChange}
        disabled={!enabled}

      />
    );
  }

  return (
    <InputText
      className={className} 
      value={data || ''}
      inputId={id}
      onChange={onChange}
      disabled={!enabled}
    />
  );

  /*
  return (
    <Input
      type={
        appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'
      }
      value={data || ''}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      multiline={appliedUiSchemaOptions.multi}
      fullWidth={!appliedUiSchemaOptions.trim || maxLength === undefined}
      inputProps={inputProps}
      error={!isValid}
      onPointerEnter={() => setShowAdornment(true) }
      onPointerLeave={() => setShowAdornment(false) }
      endAdornment={
        <InputAdornment
          position='end'
          style={{
            display:
              !showAdornment || !enabled || data === undefined ? 'none' : 'flex',
            position: 'absolute',
            right: 0
          }}
        >
          <IconButton
            aria-label='Clear input field'
            onClick={() => handleChange(path, undefined)}   
          >
            <Close style={{background: inputDeleteBackgroundColor, borderRadius: '50%'}}/>
          </IconButton>
        </InputAdornment>
      }
      inputComponent={inputComponent}
    />
  );
  */
}, areEqual);