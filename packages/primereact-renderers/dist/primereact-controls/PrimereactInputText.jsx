/*
  The MIT License
  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import React from 'react';
import { areEqual } from '@jsonforms/react';
//import Input, { InputProps } from '@material-ui/core/Input';
import { InputText } from 'primereact/inputtext';
import merge from 'lodash/merge';
/*
import IconButton from '@material-ui/core/IconButton';
import Close from '@material-ui/icons/Close';
import { useTheme } from '@material-ui/core/styles';
import { JsonFormsTheme } from '../util';
import { InputBaseComponentProps } from '@material-ui/core';
*/
/*
interface MuiTextInputProps {
  muiInputProps?: InputProps['inputProps'];
  inputComponent?: InputProps['inputComponent'];
}
*/
//export const PmrcInputText = React.memo((props: CellProps & WithClassname & MuiTextInputProps) => {
export const PrimereactInputText = React.memo((props) => {
    const { data, config, className, id, enabled, uischema, isValid, path, handleChange, schema
    //muiInputProps,
    //inputComponent
     } = props;
    const maxLength = schema.maxLength;
    const appliedUiSchemaOptions = merge({}, config, uischema.options);
    //let inputProps: InputBaseComponentProps;
    let inputProps = {};
    if (appliedUiSchemaOptions.restrict) {
        inputProps = { maxLength: maxLength };
    }
    else {
        inputProps = {};
    }
    /*
    inputProps = merge(inputProps, muiInputProps);
  
    if (appliedUiSchemaOptions.trim && maxLength !== undefined) {
      inputProps.size = maxLength;
    }
    */
    const onChange = (ev) => handleChange(path, ev.target.value);
    /*
    const theme: JsonFormsTheme = useTheme();
    const inputDeleteBackgroundColor = theme.jsonforms?.input?.delete?.background || theme.palette.background.default;
    */
    return (<span className="p-input-icon-left">
      <i className="pi pi-search"/>
      <InputText type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'} value={data || ''} onChange={onChange} className={className} id={id} disabled={!enabled} autoFocus={appliedUiSchemaOptions.focus}/>
    </span>);
}, areEqual);
