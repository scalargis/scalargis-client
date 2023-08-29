import React, { useEffect } from 'react';
import {
  showAsRequired,
  ControlProps,
  isDescriptionHidden,
} from '@jsonforms/core';

//import { Hidden, InputLabel, FormControl, FormHelperText } from '@mui/material';
import merge from 'lodash/merge';
import { useFocus } from '../util';

export interface WithInput {
  input: any;
}

export const PrimereactInputControl = (props: ControlProps & WithInput) => {
  const [focused, onFocus, onBlur] = useFocus();
  const {    
    id,
    description,
    path,
    errors,
    label,
    uischema,
    visible,
    required,
    config,
    handleChange,
    input,
  } = props;
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  // Clear value if control is changed to not visible
  // TODO: try to implement a more elegant solution  
  useEffect(() => {
    if (!visible) {
      handleChange(path, undefined);
    }
  }, [visible]);

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const firstFormHelperText = showDescription
    ? description
    : !isValid
    ? errors
    : null;
  const secondFormHelperText = showDescription && !isValid 
    ? errors 
    : null;
  const InnerComponent = input;

  const labelText = showAsRequired(
      required || false, 
      appliedUiSchemaOptions.hideRequiredAsterisk
    ) ? `${label}*` : label;

  const labelClassName = `${!isValid ? 'p-invalid' : ''}`;

  return (
    <div
      hidden={!visible}
      onFocus={onFocus}
      onBlur={onBlur}
      id={id}
      className='p-field'
    >
      <label htmlFor={id + '-input'} className={labelClassName}>
        {labelText}
      </label>      
      <InnerComponent
        {...props}
        id={id + '-input'}
        isValid={isValid}
        visible={visible}
      />
      <small id={`${id}-input-help1`} className={`p-d-block ${!showDescription && !isValid ? 'p-error' : ''}`}>{firstFormHelperText}</small>
      <small id={`${id}-input-help2`} className="p-d-block p-error">{secondFormHelperText}</small>
      {/*
      <div className={divClassNames}>
        first{firstFormHelperText}
      </div>
      <div className={divClassNames}>
        second{secondFormHelperText}
      </div>
      */}
    </div>
  );  
  /*
  return (
    <Hidden xsUp={!visible}>
      <FormControl
        fullWidth={!appliedUiSchemaOptions.trim}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
        variant={'standard'}
      >
        <InputLabel
          htmlFor={id + '-input'}
          error={!isValid}
          required={showAsRequired(
            required,
            appliedUiSchemaOptions.hideRequiredAsterisk
          )}
        >
          {label}
        </InputLabel>
        <InnerComponent
          {...props}
          id={id + '-input'}
          isValid={isValid}
          visible={visible}
        />
        <FormHelperText error={!isValid && !showDescription}>
          {firstFormHelperText}
        </FormHelperText>
        <FormHelperText error={!isValid}>{secondFormHelperText}</FormHelperText>
      </FormControl>
    </Hidden>
  );
  */
};