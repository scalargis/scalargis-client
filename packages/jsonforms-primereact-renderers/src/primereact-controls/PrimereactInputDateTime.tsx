import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';

const toISOString = (inputDateTime: string) => {
  return (inputDateTime != '' ? inputDateTime + ':00.000Z' : undefined);
};

export const PrimereactInputDateTime = React.memo(function PrimereactInputDateTime(
  props: CellProps & WithClassname
) {
  const { data, className, id, enabled, uischema, isValid, path, handleChange, config } =
    props;

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <input
      type='datetime-local'
      value={(data || '').substr(0, 16)}
      onChange={ev => handleChange(path, toISOString(ev.target.value))}
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
    />
  );
});