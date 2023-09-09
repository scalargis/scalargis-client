import React, { useMemo } from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { MultiSelect } from 'primereact/multiselect';
import merge from 'lodash/merge';
import { TranslateProps } from '@jsonforms/react';
import { i18nDefaults } from '../util';


interface RequiredProp {
  required?: boolean;
}

export const PrimereactMultiSelect = React.memo(function PrimereactMultiSelect(
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
      ? msg = t(`${locale}.oneofenum.placeholder`, i18nDefaults['oneofenum.placeholder'], { schema, uischema, path })
      : msg = t('oneofenum.placeholder', i18nDefaults['oneofenum.placeholder'], { schema, uischema, path });    
    return msg;   
  }, [t, schema, uischema, path]);

  return(
    <MultiSelect
      className={`${className || ''}${!isValid ? ' p-invalid' : ''}`}
      inputId={id}
      value={data || ''}
      options={options}
      disabled={!enabled}
      onChange={ev => {
        const newVal = ev?.value?.length ? ev.value : undefined;
        //handleChange(path, ev.value);
        handleChange(path, newVal);
      }}
      placeholder={noneOptionLabel}
      showClear={!required && data}
      display="chip"
    />
  );
});