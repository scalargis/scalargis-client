import React from 'react';
import {
  computeLabel,
  ControlProps,
  ControlState,
  isDescriptionHidden,
  isPlainLabel
} from '@jsonforms/core';
import { Control } from '@jsonforms/react';

import merge from 'lodash/merge';

export class PrimereactInputControl extends Control {
  render() {
    const {
      description,
      id,  
      errors,
      label,
      uischema,
      visible,
      required,
      config,
      input
    } = this.props;
    
    const isValid = errors.length === 0;
    
    const divClassNames = ['validate']
      .concat(isValid ? 'input-description' : 'validation_error')
      .join(' ');

    const appliedUiSchemaOptions = merge({}, config, uischema.options);

    const showDescription = !isDescriptionHidden(
      visible,
      description,
      this.state.isFocused,
      appliedUiSchemaOptions.showUnfocusedDescription
    );

    const labelText = isPlainLabel(label) ? label : label.default;

    const firstFormHelperText = showDescription
      ? description
      : !isValid
      ? errors
      : null;
    const secondFormHelperText = showDescription && !isValid ? errors : null;
    const InnerComponent = input;
    
    return (
      <div
        hidden={!visible}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        id={id}
      >
        <label htmlFor={id + '-input'}>
          {computeLabel(
            labelText,
            required,
            appliedUiSchemaOptions.hideRequiredAsterisk
          )}          
        </label>
        <InnerComponent
          {...this.props}
          id={id + '-input'}
          isValid={isValid}
          visible={visible}
        />
        <div className={divClassNames}>
          {!isValid ? errors : showDescription ? description : null}
        </div>
      </div>
    );
    
    /*
    return (
      <Hidden xsUp={!visible}>
        <FormControl
          fullWidth={!appliedUiSchemaOptions.trim}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          id={id}
        >
          <InputLabel
            htmlFor={id + '-input'}
            error={!isValid}
          >
            {computeLabel(
              isPlainLabel(label) ? label : label.default,
              required,
              appliedUiSchemaOptions.hideRequiredAsterisk
            )}
          </InputLabel>
          <InnerComponent
            {...this.props}
            id={id + '-input'}
            isValid={isValid}
            visible={visible}
          />
          <FormHelperText error={!isValid && !showDescription}>
            {firstFormHelperText}
          </FormHelperText>
          <FormHelperText error={!isValid}>
            {secondFormHelperText}
          </FormHelperText>
        </FormControl>
      </Hidden>
    );
    */
  }
}