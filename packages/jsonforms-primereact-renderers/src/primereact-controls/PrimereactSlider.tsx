import React from 'react';
import { CellProps, WithClassname, ControlProps } from '@jsonforms/core';
import { Slider } from 'primereact/slider';
import merge from 'lodash/merge';


export const PrimereactSlider = React.memo(function PrimereactSlider(
    props: CellProps & WithClassname
  ) {
  const {
    data,
    className,
    id,
    enabled,
    schema,
    uischema,
    path,
    handleChange,
    config
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  /*
  const inputPropsMerged = merge({}, inputProps, {
    autoFocus: !!appliedUiSchemaOptions.focus,
  });
  */ 
  const sliderProps = {
    min: schema.minimum,
    max: schema.maximum,
    step: schema.multipleOf || 1
  };

  return (
    <Slider 
      value={data != null ? data : schema?.default}
      id={id}
      disabled={!enabled}
      onChange={(e) => handleChange(path, e.value)}
      className={`${className} p-m-3`}
      {...sliderProps}
    />
  );

});