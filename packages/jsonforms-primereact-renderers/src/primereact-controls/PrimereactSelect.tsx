import React, { useMemo } from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

//import { MenuItem, Select } from '@mui/material';
import { Dropdown } from 'primereact/dropdown';
import merge from 'lodash/merge';
import { TranslateProps } from '@jsonforms/react';
import { i18nDefaults } from '../util';


interface RequiredProp {
  required?: boolean;
}

export const PrimereactSelect = React.memo(function MuiSelect(
  props: EnumCellProps & WithClassname & TranslateProps & RequiredProp
) {
  const {
    data,
    className,
    id,
    enabled,
    schema,
    uischema,
    isValid,
    path,
    handleChange,
    options,
    config,
    required,
    t,
    locale
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const noneOptionLabel = useMemo( () => {
      let msg;
      locale 
        ? msg = t(`${locale}.enum.placeholder`, i18nDefaults['enum.placeholder'], { schema, uischema, path })
        : msg = t('enum.placeholder', i18nDefaults['enum.placeholder'], { schema, uischema, path });    
      return msg;
    }, [t, schema, uischema, path]);
  return(
    <Dropdown
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      inputId={id}
      value={data || ''}
      disabled={!enabled}
      options={options} 
      onChange={ev => handleChange(path, ev.value)}
      placeholder={noneOptionLabel}
      showClear={!required && data} />
  );  
  /*
  return (
    <Select
      className={className}
      id={id}
      disabled={!enabled}
      autoFocus={appliedUiSchemaOptions.focus}
      value={data !== undefined ? data : ''}
      onChange={(ev) => handleChange(path, ev.target.value || undefined)}
      fullWidth={true}
      variant={'standard'}
    >
      {[
        <MenuItem value={''} key='jsonforms.enum.none'>
          <em>{noneOptionLabel}</em>
        </MenuItem>,
      ].concat(
        options.map((optionValue) => (
          <MenuItem value={optionValue.value} key={optionValue.value}>
            {optionValue.label}
          </MenuItem>
        ))
      )}
    </Select>
  );
  */
});