import React, { useMemo } from 'react';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { TranslateProps } from '@jsonforms/react';
import merge from 'lodash/merge';
import { Dropdown } from 'primereact/dropdown';


import { i18nDefaults } from '@scalargis/jsonforms-primereact-renderers'


interface RequiredProp {
  required?: boolean;
}

export const PrimereactSelectExtended = React.memo(function PrimereactSelectExtended(
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
      value={data?.const || data || ''}
      disabled={!enabled}
      options={options}
      emptyMessage="" 
      onChange={ev => {
        handleChange(path, ev.value);

        let dependentControls;
        for (const [key, value] of Object.entries(schema)) {
          if (key === "dependent_controls") {
            dependentControls = value;
            break;
          }
        }

        console.log(dependentControls);

        //Custom behaviour - clear dependent controls values on change
        //if (Array.isArray(schema["dependent_controls" as string]) && schema["dependent_controls" as string]?.length) {
        //  schema["dependent_controls"].forEach(ctrlPath => {
        if (Array.isArray(dependentControls) && dependentControls.length) {
          dependentControls.forEach(ctrlPath => {
            handleChange(ctrlPath, undefined);
          });
        }
      }}
      placeholder={noneOptionLabel}
      showClear={!required && data} />
  );
});