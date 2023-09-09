import React, { useState } from 'react';
import { CellProps, WithClassname } from '@jsonforms/core';
/*
import {
  IconButton,
  Input,
  InputAdornment,
  InputBaseComponentProps,
  InputProps,
  useTheme,
} from '@mui/material';
*/
import merge from 'lodash/merge';
//import Close from '@mui/icons-material/Close';
import { InputText } from 'primereact/inputtext';
import {Password} from 'primereact/password';
//import { JsonFormsTheme, useDebouncedChange } from '../util';
import { useDebouncedChange } from '../util';

/*
interface MuiTextInputProps {
  muiInputProps?: InputProps['inputProps'];
  inputComponent?: InputProps['inputComponent'];
}
*/
interface PrimereactTextInputProps {
  primereactInputProps?: any;
  inputComponent?: any;
}

/*
const eventToValue = (ev: any) =>
  ev.target.value === '' ? undefined : ev.target.value;
*/

export const PrimereactInputText = React.memo(function PrimereactInputText(
//  props: CellProps & WithClassname & MuiTextInputProps
    props: CellProps & WithClassname & PrimereactTextInputProps
) {
  const [showAdornment, setShowAdornment] = useState(false);
  const {
    data,
    config,
    className,
    id,
    enabled,
    uischema,
    isValid,
    path,
    handleChange,
    schema,
    //muiInputProps,
    primereactInputProps,
    inputComponent,
  } = props;
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  //let inputProps: InputBaseComponentProps;
  let inputProps;
  if (appliedUiSchemaOptions.restrict) {
    inputProps = { maxLength: maxLength };
  } else {
    inputProps = {};
  }

  //inputProps = merge(inputProps, muiInputProps);
  inputProps = merge(inputProps, primereactInputProps);

  if (appliedUiSchemaOptions.trim && maxLength !== undefined) {
    inputProps.size = maxLength;
  }

  /*
  const [inputText, onChange, onClear] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );
  const onPointerEnter = () => setShowAdornment(true);
  const onPointerLeave = () => setShowAdornment(false);
  */

  const onChange = (ev: any) => {
    const newVal = ev.target.value != '' ? ev.target.value : undefined;
    handleChange(path,newVal);
  }

  /*
  const theme: JsonFormsTheme = useTheme();

  const closeStyle = {
    background:
      theme.jsonforms?.input?.delete?.background ||
      theme.palette.background.default,
    borderRadius: '50%',
  };
  */

  if (appliedUiSchemaOptions.format === 'password') {
    return (
      <Password
        className={className}
        value={data || ''}
        inputId={id}
        onChange={onChange}
        disabled={!enabled}
        {...inputProps}
      />
    );
  }

  return (
    <InputText
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      value={data || ''}
      id={id}
      onChange={onChange}
      disabled={!enabled}
      {...inputProps}
    />
  );

  /*
  return (
    <Input
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      value={inputText}
      onChange={onChange}
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      multiline={appliedUiSchemaOptions.multi}
      fullWidth={!appliedUiSchemaOptions.trim || maxLength === undefined}
      inputProps={inputProps}
      error={!isValid}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      endAdornment={
        <InputAdornment
          position='end'
          style={{
            display:
              !showAdornment || !enabled || data === undefined
                ? 'none'
                : 'flex',
            position: 'absolute',
            right: 0,
          }}
        >
          <IconButton
            aria-label='Clear input field'
            onClick={onClear}
            size='large'
          >
            <Close style={closeStyle} />
          </IconButton>
        </InputAdornment>
      }
      inputComponent={inputComponent}
    />
  );
  */
});