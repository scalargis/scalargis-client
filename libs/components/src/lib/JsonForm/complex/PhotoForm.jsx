import React, { useState, useMemo } from 'react';
import { Button, Group, Modal } from '@mantine/core';

import { JsonForm, JsonFormDefaultRenderers, FormErrors } from '../../components';

import { translateMsg } from './../util/i18n';

export default function PhotoForm(props) {

  const { schema, path, label, t, locale } = props;

  const { getWindowSize } = props.utils;

  const [isSaving, setIsSaving] = useState(false);

  const [formErrors, setFormErrors] = useState();
  const [formData, setFormData] = useState({...(props?.data || {})});

  const [showFormErrors, setShowFormErrors] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const uischema = props.uischema.elements[0];

  function close() {
    props.setShowForm(false);
  }

  const onSave = (e) => {
    if (!formData?.file?.data || !formData?.file?.filename) {
      const prefix = "PhotoForm";
      const elem = `${locale}.${prefix}`;
      const fallbackElem = `${locale}.controls`;
      const message = translateMsg(`${elem}.addFileRequired`, `${fallbackElem}.addFileRequired`, 'You need to add a file.', {t, schema, uischema, path});
      setFormErrors([{message}]);
      setShowFormErrors(true);
      return;
    }

    if (formErrors?.length > 0) {
      setShowFormErrors(true);
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
    <Modal
      title={labels.title}
      opened={!!props.showForm}
      className="jsonform-photo-form-editor"
      size={isMobile ? '90%' : '50vw'}
      onClose={() => props.setShowForm(false)}
      >
        <div>
          <JsonForm
            data={formData}
            onChange={({errors, data}) => {
              setFormErrors(errors);
              setFormData(data);
              setShowFormErrors(false);
            }}
            schema={schema}
            uischema={uischema}
            renderers={JsonFormDefaultRenderers}
            locale={locale}
          />
          <FormErrors errors={formErrors} data={formData} show={showFormErrors} displayMode="static" />
        </div>
        <Group justify="flex-end" mt="md">
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
    </Modal>
  )
}
