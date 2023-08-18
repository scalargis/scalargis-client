import React from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
import merge from 'lodash/merge';

import './../style.css';

export const PrimereactInputDate = React.memo(function PrimereactInputDate(
  props: CellProps & WithClassname
) {
  const { data, className, id, enabled, uischema, isValid, path, handleChange, config } =
    props;

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <input
      type='date'
      value={data || ''}
      onChange={ev => {
        const newVal = ev.target.value != '' ? ev.target.value : undefined;
        handleChange(path, newVal);
      }}
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
    />
  );
});