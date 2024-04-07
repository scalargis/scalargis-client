import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';

import { I18N_NAMESPACE } from './../i18n/index';


export default function WizardStepType(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  // Translate type
  const types = useMemo(() => {
    return (props?.types || []).map( tp => {
      return {
        ...tp,
        label: t(tp.value, tp.label)
      }
    });
  }, [i18n?.resolvedLanguage]);

  const type = props?.wizardData?.type;

  return (
    <div>
      
      <div className="p-mt-2">
        { types.map(t => (
          <div className="p-field-radiobutton" key={t.value}>
            <RadioButton
              id={'wizard_type' + t.value}
              value={t.value}
              name="type"
              onChange={(e) => props.onChange(e.value)}
              checked={type === t.value}
            />
            <label htmlFor={'wizard_type' + t.value}>{ t.label }</label>
          </div>
        ))}
      </div>
      
      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button           
          disabled={!type}
          onClick={e => {
            props.onSave();
          }}
          label={t("next", "Seguinte")} />
      </div>
    </div>
  )
}
