import React, { useMemo } from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { RadioButton } from 'primereact/radiobutton';
import merge from 'lodash/merge';


export const PrimereactRadioGroup = React.memo(function PrimereactRadioGroup(
  props: EnumCellProps & WithClassname
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
    options,
    config
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (    
    <React.Fragment>
    {
      (options || []).map((option) => {
        return (
            <div key={option.value} className="p-mb-1">
              <RadioButton                
                value={option.value}
                inputId={`${id}-${option.value}`}
                name={id}
                onChange={(e) => {
                  handleChange(path, e.value)
                }}
                checked={data === (option.value)}
                disabled={!enabled}
                className="p-mr-1"
              />
              <label htmlFor={`${id}-${option.value}`}>{option.label}</label>
            </div>
        )
      })
    }
    </React.Fragment>
  );
});