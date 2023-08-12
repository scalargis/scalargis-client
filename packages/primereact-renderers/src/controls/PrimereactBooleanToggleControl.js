import isEmpty from 'lodash/isEmpty';
import React from 'react';
import {
  isBooleanControl,
  RankedTester,
  rankWith,
  ControlProps,
  optionIs,
  and  
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { PrimereactToggle } from '../primereact-controls/PrimereactToggle';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactBooleanToggleControl = (props) => {
  return (
    <PrimereactInputControl {...props} input={PrimereactToggle} />
  )
  /*
  return (
    <Hidden xsUp={!visible}>
      <FormControlLabel
        label={label}
        id={id}
        control={
          <MuiCheckbox
            id={`${id}-input`}
            isValid={isEmpty(errors)}
            data={data}
            enabled={enabled}
            visible={visible}
            path={path}
            uischema={uischema}
            schema={schema}
            rootSchema={rootSchema}
            handleChange={handleChange}
            errors={errors}
            config={config}
          />
        }
      />
    </Hidden>
  );
  */
};

export const primereactBooleanToggleControlTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true))
);
export default withJsonFormsControlProps(PrimereactBooleanToggleControl);