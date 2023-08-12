import React from 'react';
import {
  cellProps, 
  WithClassname,
  computeLabel,
  ControlState,
  DispatchPropsOfControl,
  isDateTimeControl,
  isDescriptionHidden,
  isPlainLabel,
  RankedTester,
  rankWith,
  StatePropsOfControl
} from '@jsonforms/core';
import { areEqual } from '@jsonforms/react';
//import { Calendar } from 'primereact/calendar';
import merge from 'lodash/merge';
import startsWith from 'lodash/startsWith';


export const PrimereactInputDateTime = React.memo((props) => {
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


  const toISOString = (inputDateTime) => {
    return (inputDateTime === '' ? '' : inputDateTime + ':00.000Z');
  };    


  return (
    <input
      type='datetime-local'
      value={(data || '').substr(0, 16)}
      onChange={ev => handleChange(path, toISOString(ev.target.value))}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={uischema.options && uischema.options.focus}
    />
  );  

  /*
  return (
    <Calendar
      value={data || null}
      onChange={(e) => {
        const datetime = e.value;
        handleChange(
          path,
          datetime ? datetime : ''
        )        
      }}
      showIcon
    />
  );
  */

  /*
  return (
    <Hidden xsUp={!visible}>
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <AnyPropsKeyboardDatePicker
          id={id + '-input'}
          label={computeLabel(
            labelText,
            required,
            appliedUiSchemaOptions.hideRequiredAsterisk
          )}
          error={!isValid}
          fullWidth={!appliedUiSchemaOptions.trim}
          helperText={!isValid ? errors : showDescription ? description : ' '}
          InputLabelProps={{ shrink: true }}
          value={data || null}
          onChange={(datetime: any) =>
            handleChange(
              path,
              datetime ? moment(datetime).format('YYYY-MM-DD') : ''
            )
          }
          format={localeDateTimeFormat}
          clearable={true}
          disabled={!enabled}
          autoFocus={appliedUiSchemaOptions.focus}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          cancelLabel={labelCancel}
          clearLabel={labelClear}
          leftArrowIcon={<KeyboardArrowLeftIcon />}
          rightArrowIcon={<KeyboardArrowRightIcon />}
          keyboardIcon={<EventIcon />}
          InputProps={inputProps}
        />
      </MuiPickersUtilsProvider>
    </Hidden>
  );
  */
}, areEqual);