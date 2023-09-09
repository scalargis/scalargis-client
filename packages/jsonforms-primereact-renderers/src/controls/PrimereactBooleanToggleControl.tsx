import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import React from 'react';
import {
  isBooleanControl,
  RankedTester,
  rankWith,
  ControlProps,
  optionIs,
  and,
  isDescriptionHidden,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
/*
import {
  FormControlLabel,
  FormHelperText,
  Tooltip,
  Hidden,
} from '@mui/material';
import { MuiToggle } from '../mui-controls/MuiToggle';
*/
import { PrimereactToggle } from '../primereact-controls/PrimereactToggle';
import { PrimereactInputControl } from './PrimereactInputControl';

/*
export const MaterialBooleanToggleControl = ({
  data,
  visible,
  label,
  id,
  enabled,
  uischema,
  schema,
  rootSchema,
  handleChange,
  errors,
  path,
  config,
  description,
}: ControlProps) => {
*/
export const PrimereactBooleanToggleControl = (props: ControlProps) => {
  const {
      data,
      visible,
      label,
      id,
      enabled,
      uischema,
      schema,
      rootSchema,
      handleChange,
      errors,
      path,
      config,
      description,
    } = props;

  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    // Checkboxes do not receive focus until they are used, so
    // we cannot rely on focus as criteria for showing descriptions.
    // So we pass "false" to treat it as unfocused.
    false,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const showTooltip =
    !showDescription &&
    !isDescriptionHidden(
      visible,
      description,
      // Tooltips have their own focus handlers, so we do not need to rely
      // on focus state here. So we pass 'true' to treat it as focused.
      true,
      // We also pass true here for showUnfocusedDescription since it should
      // render regardless of that setting.
      true
    );

  const firstFormHelperText = showDescription
    ? description
    : !isValid
    ? errors
    : null;
  const secondFormHelperText = showDescription && !isValid ? errors : null;

  const descriptionIds = [];
  const tooltipId = `${id}-tip`;
  const helpId1 = `${id}-help1`;
  const helpId2 = `${id}-help2`;
  if (showTooltip) {
    descriptionIds.push(tooltipId);
  }
  if (firstFormHelperText) {
    descriptionIds.push(helpId1);
  }
  if (secondFormHelperText) {
    descriptionIds.push(helpId2);
  }
  const ariaDescribedBy = descriptionIds.join(' ');

  return (
    <PrimereactInputControl {...props} input={PrimereactToggle} />
  );
  /*
  return (
    <Hidden xsUp={!visible}>
      <Tooltip id={tooltipId} title={showTooltip ? description : ''}>
        <FormControlLabel
          label={label}
          id={id}
          control={
            <MuiToggle
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
              inputProps={{
                'aria-describedby': ariaDescribedBy,
              }}
            />
          }
        />
      </Tooltip>
      <FormHelperText id={helpId1} error={!isValid && !showDescription}>
        {firstFormHelperText}
      </FormHelperText>
      <FormHelperText id={helpId2} error={!isValid}>
        {secondFormHelperText}
      </FormHelperText>
    </Hidden>
  );
  */
};

export const primereactBooleanToggleControlTester: RankedTester = rankWith(
  3,
  and(isBooleanControl, optionIs('toggle', true))
);

export default withJsonFormsControlProps(PrimereactBooleanToggleControl);