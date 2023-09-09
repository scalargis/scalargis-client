import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';

const appendSecondsIfNecessary = (value: unknown) => {
  if (value === '') return undefined;
    
  if (typeof value === 'string') {
    const splitValue = value.split(':');
    if (splitValue.length === 2) {
      splitValue.push('00');
    }
    return splitValue.join(':');
  }
  return value;
};

export const PrimereactInputTime = React.memo(function PrimereactInputTime(
  props: CellProps & WithClassname
) {
  const { data, className, id, enabled, uischema, isValid, path, handleChange, config } =
    props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <input
      type='time'
      value={data || ''}
      onChange={(ev) =>
        handleChange(path, appendSecondsIfNecessary(ev.target.value))
      }      
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
    />
  );
});