import React from 'react';
import { useTranslation } from "react-i18next";
import { TextInput } from '@mantine/core';

/**
 * The config-driven form fields PrintPanel2 and PrintPanelItem share:
 * `form_fields.groups` renders titled groups of fields, `form_fields.fields`
 * a flat list. Required fields show their message through the error prop.
 */
export default function PrintFormFields({ formFields, fields, handleFieldChange }) {
  const { t } = useTranslation();

  if (!formFields) return null;

  const renderField = (field_key, field) => (
    <div key={field_key} className="field">
      { field.header && <h4>{field.header}</h4> }
      <TextInput id={field_key}
        label={field.showLabel ? field.title : undefined}
        placeholder={!field.header && !field.showLabel ? field.title : ''}
        title={!field.header && !field.showLabel ? field.title : ''}
        value={fields[field_key] || ''}
        onChange={handleFieldChange}
        error={(field.required && !fields[field_key]) ? `${t("requiredField", "Campo de preenchimento obrigatório")}.` : undefined}
      />
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
