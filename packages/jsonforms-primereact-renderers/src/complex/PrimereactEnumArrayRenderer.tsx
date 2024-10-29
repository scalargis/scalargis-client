import react, { useEffect } from 'react';
import {
  and,
  showAsRequired,
  ControlProps,
  isDescriptionHidden,
  DispatchPropsOfMultiEnumControl,
  hasType,
  JsonSchema,
  OwnPropsOfEnum,
  Paths,
  RankedTester,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
} from '@jsonforms/core';

import merge from 'lodash/merge';

import { withJsonFormsMultiEnumProps } from '@jsonforms/react';
//import { MuiCheckbox } from '../mui-controls';
import { PrimereactCheckbox } from '../primereact-controls';
/*
import {
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Hidden,
} from '@mui/material';
*/
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { useFocus } from '../util';

export const PrimereactEnumArrayRenderer = ({
  schema,
  visible,
  errors,
  path,
  options,
  data,
  addItem,
  removeItem,
  handleChange: _handleChange,

  id,
  enabled,
  label,
  config,
  required,
  uischema,
  description,

  ...otherProps
}: ControlProps & OwnPropsOfEnum & DispatchPropsOfMultiEnumControl) => {

  // Clear value if control is changed to not visible
  // TODO: try to implement a more elegant solution
  useEffect(() => {
    if (!visible) {
      _handleChange(path, undefined);
    }
  }, [visible]);

  const [focused, onFocus, onBlur] = useFocus();

  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);  
  
  const showDescription = !isDescriptionHidden(
    visible,
    description,
    focused,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  const firstFormHelperText = showDescription
    ? description
    : !isValid
    ? errors
    : null;
  const secondFormHelperText = showDescription && !isValid 
    ? errors 
    : null;

  const labelText = showAsRequired(
    required || false, 
    appliedUiSchemaOptions.hideRequiredAsterisk
  ) ? `${label}*` : label;

  const labelClassName = `${!isValid ? 'p-invalid' : ''}`;    

  return (
    <div
      hidden={!visible}
      onFocus={onFocus}
      onBlur={onBlur}
      id={id}
      className='field'
    >     
      <label htmlFor={id + '-input'} className={labelClassName}>
        {labelText}
      </label>
      <div>
        {(options || []).map((option, index) => {
          const optionPath = Paths.compose(path, `${index}`);
          const checkboxValue = data?.includes && data?.includes(option.value)
            ? option.value
            : undefined;
          return (

            <div key={option.value}>
              <PrimereactCheckbox
                key={'checkbox-' + option.value}
                id={`${id}-${option.value}-input`}
                isValid={isEmpty(errors)}
                path={optionPath}
                handleChange={(_childPath, newValue) => {
                  //let newData: (any)[] | undefined;
                  let newData;
                  if (newValue) {
                    if ((data || []).indexOf(option.value) === -1) {
                      newData = data || [];
                      newData.push(option.value);
                    }
                  } else {
                    newData = (data || []).filter((v: any) => v !== option.value);
                  }
                  newData = newData?.length ? newData : undefined;
                  _handleChange(path, newData);
                  /*
                  newValue
                    ? addItem(path, option.value)
                    : removeItem ? removeItem(path, option.value) : null
                  }
                  */
                }}
                data={checkboxValue}
                errors={errors}
                schema={schema}
                uischema={uischema}
                visible={visible}
                enabled={enabled}
                className="mr-1"
                {...otherProps}
              />
              <label htmlFor={`${id}-${option.value}-input`}>{option.label}</label>
            </div>

          );
        })}        
      </div>
      <small id={`${id}-input-help1`} className={`p-d-block ${!showDescription && !isValid ? 'p-error' : ''}`}>{firstFormHelperText}</small>
      <small id={`${id}-input-help2`} className="p-d-block p-error">{secondFormHelperText}</small>
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
                label={option.label}
              />
            );
          })}
        </FormGroup>
        <FormHelperText error>{errors}</FormHelperText>
      </FormControl>
    </Hidden>
  );
  */
};

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema): boolean =>
(schema.type === 'string' || schema.type === 'integer') && schema.enum !== undefined;

export const primereactEnumArrayRendererTester: RankedTester = rankWith(
  5,
  and(
    uiTypeIs('Control'),
    and(
      schemaMatches(
        (schema) =>
          hasType(schema, 'array') &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches('items', (schema) => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      })
    )
  )
);

export default withJsonFormsMultiEnumProps(PrimereactEnumArrayRenderer);