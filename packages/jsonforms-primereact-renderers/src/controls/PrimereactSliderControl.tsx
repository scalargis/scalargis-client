import React, { useCallback } from 'react';
import {
  ControlProps,
  showAsRequired,
  isDescriptionHidden,
  isRangeControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { PrimereactSlider } from '../primereact-controls/PrimereactSlider';
import { PrimereactInputControl } from './PrimereactInputControl';
/*
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Hidden,
  Slider,
  Typography,
} from '@mui/material';
*/
import merge from 'lodash/merge';
import { useFocus } from '../util';

export const PrimereactSliderControl = (props: ControlProps) => (
  <PrimereactInputControl {...props} input={PrimereactSlider} />
);
/*
export const MaterialSliderControl = (props: ControlProps) => {
  const [focused, onFocus, onBlur] = useFocus();
  const {
    id,
    data,
    description,
    enabled,
    errors,
    label,
    schema,
    handleChange,
    visible,
    path,
    required,
    config,
  } = props;
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options);
  const labelStyle: { [x: string]: any } = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  };
  const rangeContainerStyle: { [x: string]: any } = {
    display: 'flex',
  };
  const rangeItemStyle: { [x: string]: any } = {
    flexGrow: '1',
  };
  const sliderStyle: { [x: string]: any } = {
    marginTop: '7px',
  };

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const onChange = useCallback(
    (_ev: any, value: any) => handleChange(path, Number(value)),
    [path, handleChange]
  );

  return (
    <Hidden xsUp={!visible}>
      <FormControl
        fullWidth={!appliedUiSchemaOptions.trim}
        onFocus={onFocus}
        onBlur={onBlur}
        id={id}
      >
        <FormLabel
          htmlFor={id}
          error={!isValid}
          component={'legend' as 'label'}
          required={showAsRequired(
            required,
            appliedUiSchemaOptions.hideRequiredAsterisk
          )}
        >
          <Typography id={id + '-typo'} style={labelStyle} variant='caption'>
            {label}
          </Typography>
        </FormLabel>
        <div style={rangeContainerStyle}>
          <Typography style={rangeItemStyle} variant='caption' align='left'>
            {schema.minimum}
          </Typography>
          <Typography style={rangeItemStyle} variant='caption' align='right'>
            {schema.maximum}
          </Typography>
        </div>
        <Slider
          style={sliderStyle}
          min={schema.minimum}
          max={schema.maximum}
          value={Number(data || schema.default)}
          onChange={onChange}
          id={id + '-input'}
          disabled={!enabled}
          step={schema.multipleOf || 1}
        />
        <FormHelperText error={!isValid}>
          {!isValid ? errors : showDescription ? description : null}
        </FormHelperText>
      </FormControl>
    </Hidden>
  );
};
*/
export const primereactSliderControlTester: RankedTester = rankWith(
  4,
  isRangeControl
);

export default withJsonFormsControlProps(PrimereactSliderControl);