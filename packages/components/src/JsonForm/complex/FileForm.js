import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

import { JsonForm, JsonFormDefaultRenderers } from '@scalargis/components';

import { translateMsg } from './../util/i18n';

export default function FileForm(props) {

  const { schema, path, label, t, locale } = props;

  const { getWindowSize, showOnPortal } = props.utils;  

  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState();

  const toast = useRef(null);  

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const uischema = props.uischema.elements[0];

  useEffect(() => {
    setFormData(props?.data);
  }, []);
 
  function close() {
    props.setShowForm(false);
  } 

  const onSave = (e) => {
    props.onSave({...formData});   
  };

  const labels = useMemo(() => {
    const prefix = "FileForm";
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
    header={label || "File"}
      visible={!!props.showForm}
      className="jsonform-file-form-editor"
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
          <form onSubmit={(e)=>{ e.preventDefault(); }}>
            <div>
              <JsonForm
                data={props.data}
                onChange={({errors, data}) => {
                  setFormData({...data});
                }}
                schema={schema}
                uischema={uischema}
                renderers={JsonFormDefaultRenderers}
                locale={locale}
              />              
            </div>
        </form>
      </div>
    </Dialog>
  )
}