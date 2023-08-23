import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

import { JsonForm, JsonFormDefaultRenderers } from '@scalargis/components';

//import './../style.css';

export default function FileForm(props) {

  const { getWindowSize, showOnPortal } = props.utils;  

  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState();

  const toast = useRef(null);  

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  
  const hideFields = !!props.uischema?.options?.hideFields;
  const hideFile = !!props.uischema?.options?.hideFile;

  const schema = props.schema;
  const uischema = props.uischema.elements[0];
  /*
  const uischema = props?.uischema?.elements?.length ? 
    { type: "VerticalLayout",
      elements: [...props.uischema.elements] 
    } : undefined;
  */

  useEffect(() => {
    setFormData(props?.data);
  }, []);
 
  function close() {
    props.setShowForm(false);
  } 

  const onSave = (e) => {
    props.onSave({...formData});   
  };

  const renderFooter = (name) => {
    return (
        <div>
            <Button 
              label="Fechar"
              icon="pi pi-times"
              disabled={isSaving ? true : false}
              onClick={() => close()} className="p-button-text" />
            <Button 
              label="Gravar"
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
      header={ "Ficheiro" }
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
          <form onSubmit={(e)=>{ e.preventDefault(); /*handleSubmit(onSubmit);*/ }}>
            <div>
              <JsonForm
                data={props.data}
                onChange={({errors, data}) => {
                  //props.onChange
                  console.log(errors);
                  console.log(data);
                  setFormData({...data});
                }}
                schema={schema}
                uischema={uischema}
                //renderers={renderers}
                renderers={JsonFormDefaultRenderers}
                //renderers={customRenderers}
                //cells={vanillaCells}
                //locale={locale}
                locale="en"
                //i18n={{locale: locale, translate: translation}}
              />              
            </div>
        </form>
      </div>
    </Dialog>
  )
}