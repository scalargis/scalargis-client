import React, { useMemo } from 'react';
import merge from 'lodash/merge';
import {
  ControlProps,
  isTimeControl,
  isDescriptionHidden,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
/*
import { FormHelperText, Hidden } from '@mui/material';
import { TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
*/
import { PrimereactInputTime } from '../primereact-controls/PrimereactInputTime';
import { PrimereactInputControl } from './PrimereactInputControl';
import { createOnChangeHandler, getData, useFocus } from '../util';

export const PrimereactTimeControl = (props: ControlProps) => {
  const [focused, onFocus, onBlur] = useFocus();
  const {
    id,
    description,
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
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const isValid = errors.length === 0;

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const format = appliedUiSchemaOptions.timeFormat ?? 'HH:mm';
  const saveFormat = appliedUiSchemaOptions.timeSaveFormat ?? 'HH:mm:ss';

  const views = appliedUiSchemaOptions.views ?? ['hours', 'minutes'];

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
    <PrimereactInputControl {...props} input={PrimereactInputTime} />
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <TimePicker
          label={label}
          value={value}
          onChange={onChange}
          format={format}
          ampm={!!appliedUiSchemaOptions.ampm}
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

export const primereactTimeControlTester: RankedTester = rankWith(
  4,
  isTimeControl
);

export default withJsonFormsControlProps(PrimereactTimeControl);