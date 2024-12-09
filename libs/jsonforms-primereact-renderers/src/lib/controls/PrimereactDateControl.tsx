import merge from 'lodash/merge';
import React, { useMemo } from 'react';
import {
  ControlProps,
  isDateControl,
  isDescriptionHidden,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
/*
import { FormHelperText, Hidden } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
*/
import { PrimereactInputDate } from '../primereact-controls/PrimereactInputDate';
import { PrimereactInputControl } from './PrimereactInputControl';
import { createOnChangeHandler, getData, useFocus } from '../util';

export const PrimereactDateControl = (props: ControlProps) => {
  const [focused, onFocus, onBlur] = useFocus();
  const {
    description,
    id,
    errors,
    label,
    uischema,
    visible,
    enabled,
    required,
    path,
    handleChange,
    data,
    config,
  } = props;
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const format = appliedUiSchemaOptions.dateFormat ?? 'YYYY-MM-DD';
  const saveFormat = appliedUiSchemaOptions.dateSaveFormat ?? 'YYYY-MM-DD';

  const views = appliedUiSchemaOptions.views ?? ['year', 'day'];

  const firstFormHelperText = showDescription
    ? description
    : !isValid
    ? errors
    : null;
  const secondFormHelperText = showDescription && !isValid ? errors : null;
  const onChange = useMemo(
    () => createOnChangeHandler(path, handleChange, saveFormat),
    [path, handleChange, saveFormat]
  );

  const value = getData(data, saveFormat);

  return (
    <PrimereactInputControl {...props} input={PrimereactInputDate} />
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label={label}
          value={value}
          onChange={onChange}
          format={format}
          views={views}
          disabled={!enabled}
          slotProps={{
            actionBar: ({ wrapperVariant }) => ({
              actions:
                wrapperVariant === 'desktop'
                  ? []
                  : ['clear', 'cancel', 'accept'],
            }),
            textField: {
              id: id + '-input',
              required:
                required && !appliedUiSchemaOptions.hideRequiredAsterisk,
              autoFocus: appliedUiSchemaOptions.focus,
              error: !isValid,
              fullWidth: !appliedUiSchemaOptions.trim,
              inputProps: {
                type: 'text',
              },
              InputLabelProps: data ? { shrink: true } : undefined,
              onFocus: onFocus,
              onBlur: onBlur,
              variant: 'standard',
            },
          }}
        />
        <FormHelperText error={!isValid && !showDescription}>
          {firstFormHelperText}
        </FormHelperText>
        <FormHelperText error={!isValid}>{secondFormHelperText}</FormHelperText>
      </LocalizationProvider>
    </Hidden>
  );
  */
};

export const primereactDateControlTester: RankedTester = rankWith(
  4,
  isDateControl
);

export default withJsonFormsControlProps(PrimereactDateControl);