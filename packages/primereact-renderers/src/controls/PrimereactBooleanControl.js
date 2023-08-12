import isEmpty from 'lodash/isEmpty';
import React from 'react';
import {
  isBooleanControl,
  RankedTester,
  rankWith,
  ControlProps
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { PrimereactCheckbox } from '../primereact-controls/PrimereactCheckbox';
import { PrimereactInputControl } from './PrimereactInputControl';

export const PrimereactBooleanControl = (props) => {
  return (
    <PrimereactInputControl {...props} input={PrimereactCheckbox} />
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

export const primereactBooleanControlTester = rankWith(
  2,
  isBooleanControl
);
export default withJsonFormsControlProps(PrimereactBooleanControl);