import React from 'react';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';


export default function WizardStepType(props) {
  const { types } = props;

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
          label="Seguinte" />
      </div>
    </div>
  )
}
