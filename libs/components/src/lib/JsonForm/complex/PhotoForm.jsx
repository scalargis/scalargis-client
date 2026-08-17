import React, { useState, useMemo } from 'react';
import { Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dialog, useIsMobile } from '@scalargis/ui';

import { JsonForm, JsonFormDefaultRenderers, FormErrors } from '../../components';

import { translateMsg } from './../util/i18n';

export default function PhotoForm(props) {

  const { schema, path, label, t, locale } = props;

  const [isSaving, setIsSaving] = useState(false);

  const [formErrors, setFormErrors] = useState();
  const [formData, setFormData] = useState({...(props?.data || {})});

  const [showFormErrors, { open: openFormErrors, close: closeFormErrors }] = useDisclosure(false);

  const isMobile = useIsMobile();

  const uischema = props.uischema.elements[0];

  function close() {
    props.setShowForm(false);
  }

  const onSave = (e) => {
    // A photo is present either inline (data) or persisted server-side (file_url).
    if (!(formData?.file?.data || formData?.file?.file_url) || !formData?.file?.filename) {
      const prefix = "PhotoForm";
      const elem = `${locale}.${prefix}`;
      const fallbackElem = `${locale}.controls`;
      const message = translateMsg(`${elem}.addFileRequired`, `${fallbackElem}.addFileRequired`, 'You need to add a file.', {t, schema, uischema, path});
      setFormErrors([{message}]);
      openFormErrors();
      return;
    }

    if (formErrors?.length > 0) {
      openFormErrors();
      return;
    }

    props.onSave({...formData});
  };

  const labels = useMemo(() => {
    const prefix = "PhotoForm";
    const elem = `${locale}.${prefix}`;
    const fallbackElem = `${locale}.controls`;
    return {
      title: translateMsg(`${elem}.${label}`, `${fallbackElem}.${label}`, 'Photo', {t, schema, uischema, path}),
      close: translateMsg(`${elem}.close`, `${fallbackElem}.close`, 'Close', {t, schema, uischema, path}),
      save: translateMsg(`${elem}.save`, `${fallbackElem}.save`, 'Save', {t, schema, uischema, path}),
    }
  }, [locale, schema, uischema, path]);

  return (
    <Dialog
      title={labels.title}
      opened={!!props.showForm}
      className="jsonform-photo-form-editor"
      size={isMobile ? '90%' : '50vw'}
      onClose={() => props.setShowForm(false)}
      footer={
        <Group justify="flex-end">
          <Button variant="subtle"
            leftSection={<i className="pi pi-times" aria-hidden="true" />}
            disabled={isSaving}
            onClick={() => close()}>
            {labels.close}
          </Button>
          <Button
            leftSection={<i className={isSaving ? "pi pi-check pi-spinner" : "pi pi-check"} aria-hidden="true" />}
            disabled={isSaving}
            data-autofocus
            onClick={onSave}>
            {labels.save}
          </Button>
        </Group>
      }
      >
        <div>
          <JsonForm
            data={formData}
            onChange={({errors, data}) => {
              setFormErrors(errors);
              setFormData(data);
              closeFormErrors();
            }}
            schema={schema}
            uischema={uischema}
            renderers={JsonFormDefaultRenderers}
            locale={locale}
          />
          <FormErrors errors={formErrors} data={formData} show={showFormErrors} displayMode="static" />
        </div>
    </Dialog>
  )
}
