import React from 'react';
import {
  cellProps, 
  WithClassname,
  computeLabel,
  ControlState,
  DispatchPropsOfControl,
  isTimeControl,
  isDescriptionHidden,
  isPlainLabel,
  RankedTester,
  rankWith,
  StatePropsOfControl
} from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
import { Calendar } from 'primereact/calendar';
import merge from 'lodash/merge';
import startsWith from 'lodash/startsWith';


export const PrimereactInputTime = React.memo((props) => {
  const {
    description,
    id,
    errors,
    label,
    uischema,
    visible,
    enabled,
    required,
    //isValid,
    path,
    handleChange,
    data,
    //momentLocale,
    config
  } = props;

  const defaultLabel = label;
  const cancelLabel = '%cancel';
  const clearLabel = '%clear';
 
  const isValid = errors.length === 0;
    
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  /*
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    this.state.isFocused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );
  */
  
  const inputProps = {};
  
  /*
  const localeDateTimeFormat = momentLocale
    ? `${momentLocale.localeData().longDateFormat('L')}`
    : 'YYYY-MM-DD';
  */    

  let labelText;
  let labelCancel;
  let labelClear;

  if (isPlainLabel(label)) {
    labelText = label;
    labelCancel = 'Cancel';
    labelClear = 'Clear';
  } else {
    labelText = defaultLabel;
    labelCancel = startsWith(cancelLabel, '%') ? 'Cancel' : cancelLabel;
    labelClear = startsWith(clearLabel, '%') ? 'Clear' : clearLabel;
  }  

  const className = ['validate']
    .concat(isValid ? 'valid select' : 'invalid select')
    .join(' ');

  return (
    <input
      type='time'
      value={data || ''}
      onChange={ev => handleChange(path, ev.target.value)}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={uischema.options && uischema.options.focus}
    />
  );  

}, areEqual);