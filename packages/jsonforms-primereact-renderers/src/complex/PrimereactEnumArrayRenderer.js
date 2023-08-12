import {
  computeLabel,
  ControlState,
  isDescriptionHidden,
  isPlainLabel,  
  and,
  ControlProps,
  DispatchPropsOfMultiEnumControl,
  hasType,
  JsonSchema,
  OwnPropsOfEnum,
  Paths,
  RankedTester,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs
} from '@jsonforms/core';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
import { PrimereactCheckbox } from '../primereact-controls';
import { startCase } from 'lodash';
import { isEmpty } from 'lodash';
import React from 'react';

import merge from 'lodash/merge';

export const PrimereactEnumArrayRenderer = ({
  id,
  schema,
  visible,
  errors,
  path,
  options,
  data,
  config,
  description,
  label,
  uischema,
  required,
  addItem,
  removeItem,
  ...otherProps
}) => {

  const isValid = errors.length === 0;
  
  const divClassNames = ['validate']
    .concat(isValid ? 'input-description' : 'validation_error')
    .join(' ');

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    //this.state.isFocused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const labelText = isPlainLabel(label) ? label : label.default;

  return (
    <div
      hidden={!visible}
      //onFocus={this.onFocus}
      //onBlur={this.onBlur}
      id={id}
    >
      <label htmlFor={id + '-input'}>
        {computeLabel(
          labelText,
          required,
          appliedUiSchemaOptions.hideRequiredAsterisk
        )}          
      </label>
      <div>
        {options.map((option, index) => {
          const optionPath = Paths.compose(path, `${index}`);
          const checkboxValue = data?.includes(option.value)
            ? option.value
            : undefined;
          return (
            <div key={option.value}>
              <PrimereactCheckbox
                key={'checkbox-' + option.value}
                id={`${id}-${option.value}-input`}
                isValid={isEmpty(errors)}
                path={optionPath}
                handleChange={(_childPath, newValue) =>
                  newValue
                    ? addItem(path, option.value)
                    : removeItem(path, option.value)
                }
                data={checkboxValue}
                errors={errors}
                schema={schema}
                uischema={uischema}
                visible={visible}
                {...otherProps}
              />
              <label htmlFor={`${id}-${option.value}-input`}>{startCase(option.label)}</label>
            </div>
          );
        })}        
      </div>
      <div className={divClassNames}>
        {!isValid ? errors : showDescription ? description : null}
      </div>
    </div>
  );

  /*
  return (
    <Hidden xlUp={!visible}>
      <FormControl component='fieldset'>
        <FormGroup row>
          {options.map((option: any, index: number) => {
            const optionPath = Paths.compose(path, `${index}`);
            const checkboxValue = data?.includes(option.value)
              ? option.value
              : undefined;
            return (
              <FormControlLabel
                id={option.value}
                key={option.value}
                control={
                  <MuiCheckbox
                    key={'checkbox-' + option.value}
                    isValid={isEmpty(errors)}
                    path={optionPath}
                    handleChange={(_childPath, newValue) =>
                      newValue
                        ? addItem(path, option.value)
                        : removeItem(path, option.value)
                    }
                    data={checkboxValue}
                    errors={errors}
                    schema={schema}
                    visible={visible}
                    {...otherProps}
                  />
                }
                label={startCase(option.label)}
              />
            );
          })}
        </FormGroup>
        <FormHelperText error>
          {errors}
        </FormHelperText>
      </FormControl>
    </Hidden>
  );
  */
};

const hasOneOfItems = (schema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf).every((entry) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema) =>
  schema.type === 'string' && schema.enum !== undefined;

export const primereactEnumArrayRendererTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches(
        schema =>
          hasType(schema, 'array') &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches('items', schema => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      })
    )
  )
);

export default withJsonFormsMultiEnumProps(PrimereactEnumArrayRenderer);