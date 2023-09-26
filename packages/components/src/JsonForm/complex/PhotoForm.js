import React, { useState, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

import { JsonForm, JsonFormDefaultRenderers, FormErrors } from '@scalargis/components';

import { translateMsg } from './../util/i18n';

export default function PhotoForm(props) {

  const { schema, path, label, t, locale } = props;

  const { getWindowSize, showOnPortal } = props.utils;  

  const [isSaving, setIsSaving] = useState(false);

  const [formErrors, setFormErrors] = useState();
  const [formData, setFormData] = useState({...(props?.data || {})});

  const [showFormErrors, setShowFormErrors] = useState(false);

  const toast = useRef(null);  

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const uischema = props.uischema.elements[0];

  function close() {
    props.setShowForm(false);
  } 

  const onSave = (e) => {
    if (!formData?.file?.data || !formData?.file?.filename) {
      setFormErrors([{message: "É necessário adicionar um ficheiro."}]);
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
      close: translateMsg(`${elem}.close`, `${fallbackElem}.close`, 'Close', {t, schema, uischema, path}),
      save: translateMsg(`${elem}.save`, `${fallbackElem}.save`, 'Save', {t, schema, uischema, path}),
    }
  }, [locale, schema, uischema, path]);

  const renderFooter = (name) => {
    return (
        <div>
            <Button 
              label={labels.close}
              icon="pi pi-times"
              disabled={isSaving ? true : false}
              onClick={() => close()} className="p-button-text" />
            <Button 
              label={labels.save}
              icon={isSaving ? "pi pi-check pi-spinner" : "pi pi-check" }
              disabled={isSaving ? true : false}
              autoFocus
              onClick={onSave} 
               />
        </div>
    );
  }

  return (
    <Dialog
      header={label || "Photo"}
      visible={!!props.showForm}
      className="jsonform-photo-form-editor"
      style={{ width: isMobile ? '90%' : '50vw' }}
      position="top"
      modal
      footer={renderFooter()}
      onHide={e => {
        props.setShowForm(false);
        }}
      >
        <div>
          {showOnPortal(<Toast ref={toast} baseZIndex={2000} />)}
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
        </div>
    </Dialog>
  )
}