import React from 'react';
import { useTranslation } from "react-i18next";
import { useFormContext } from 'react-hook-form';
import { TextInput } from '@mantine/core';
import { Field } from '@scalargis/ui';

/**
 * The config-driven form fields PrintPanel2 and PrintPanelItem share:
 * `form_fields.groups` renders titled groups of fields, `form_fields.fields`
 * a flat list. `control` comes off the RHF <FormProvider> Print.jsx mounts
 * (not threaded as a prop, since PrintPanel2/PrintPanelItem — unconverted
 * this session — still pass their own `fields`/`handleFieldChange` pair
 * down for their OWN validation logic and no longer for this component).
 * Required fields now validate through <Field>/RHF, not the hand-rolled
 * `error={(field.required && !fields[field_key]) ? … : undefined}` idiom
 * this replaces (B-08, findings/02 theme 4).
 */
export default function PrintFormFields({ formFields }) {
  const { t } = useTranslation();
  const { control } = useFormContext();

  if (!formFields) return null;

  const renderField = (field_key, field) => (
    <div key={field_key} className="field">
      { field.header && <h4>{field.header}</h4> }
      <Field
        name={field_key}
        control={control}
        label={field.showLabel ? field.title : undefined}
        required={!!field.required}
        rules={field.required ? { required: `${t("requiredField", "Campo de preenchimento obrigatório")}.` } : undefined}
      >
        {(rhfField, fieldState) => (
          <TextInput
            {...rhfField}
            value={rhfField.value || ''}
            placeholder={!field.header && !field.showLabel ? field.title : ''}
            title={!field.header && !field.showLabel ? field.title : ''}
            error={fieldState.error?.message}
          />
        )}
      </Field>
    </div>
  );

  return (
    <>
      { formFields.groups &&
        <div className="mt-2">
          { Object.entries(formFields.groups).map(([groupKey, group]) => {
            if (!group.active) return null;
            return <div key={groupKey} className="p-fluid">
              <h4>{group.title}</h4>
              { group.fields && Object.entries(group.fields).map(([fieldKey, field]) => {
                if (!field.active) return null;
                return renderField(groupKey + '.' + fieldKey, field);
              }) }
            </div>
          }) }
        </div>
      }

      { formFields.fields &&
        <div className="mt-2">
          { Object.entries(formFields.fields).map(([fieldKey, field]) => {
            if (!field.active) return null;
            return <div key={fieldKey} className="p-fluid">
              {renderField(fieldKey, field)}
            </div>
          }) }
        </div>
      }
    </>
  );
}
