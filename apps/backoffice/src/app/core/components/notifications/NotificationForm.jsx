import React, { useContext, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { DataView } from 'primereact/dataview';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

function NotificationForm(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const { core } = useContext(AppContext);
 
  const toast = useRef(null);

  const API_URL = core.API_URL; 

  const goBack = () => {
    if (location.state && location.state.from) {
      /*
      const new_location = {
        pathname: location.state.from,
        state: { 
          searchParams: {...location.state.previousSearchParams}
        }
      }
      location.replace(new_location);
      */
      const state = { 
        searchParams: {...location.state.previousSearchParams}
      }
      navigate(location.state.from, { replace: true, state })
    } else {
      navigate(-1);
    }
  }

  const onCheck = () => {  
    const values = {
      checked: true,
      checked_date: new Date().toISOString().slice(0, 10)
    }
    updateNotification(values);  
  }

  const onClose = () => {
    const values = {
      closed: true,
      closed_date: new Date().toISOString().slice(0, 10)
    }
    updateNotification(values);
  }

  const onReopen = () => {
    const values = {
      closed: false,
      closed_date: null
    }
    updateNotification(values);
  }

  const onSave = () => {
    const values = {
      notes: data.notes
    }
    updateNotification(values);
  }  

  const updateNotification = (values) => {
    setIsSaving(true); 

    const provider = dataProvider(API_URL + '/portal');      
    const params = {
      id: data.id,
      data: values
    }
    provider.update('notifications', params).then(d => {       
      toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});      
      setData({...d.data});
    }).catch(e => {
      toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});        
    }).finally(() => {
      setIsSaving(false);
    });
  }

  const rightToolbarTemplate = () => {
    return (
        <React.Fragment>
          <Button
            type="button" 
            label="Voltar" 
            icon="pi pi-left" 
            className="p-button-secondary p-mr-4"
            disabled={isSaving ? true : false} 
            onClick={goBack} />
          { data?.status?.value === 0 && <Button
            type="button" 
            label="Lida"
            className="p-mr-2"
            icon_={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
            disabled={isSaving ? true : false} 
            onClick={onCheck} /> }
          { data?.status?.value !== 2 && <Button
            type="button" 
            label="Encerrar"
            className="p-mr-2"
            icon_={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
            disabled={isSaving ? true : false}
            onClick={onClose} /> }
          { data?.status?.value === 2 && <Button
            type="button" 
            label="Reabrir"
            className="p-mr-2"
            icon_={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
            disabled={isSaving ? true : false}
            onClick={onReopen} /> }
          <Button
            type="button" 
            label="Gravar"
            className="p-mr-2"
            icon_={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
            disabled={isSaving ? true : false}
            onClick={onSave} />
        </React.Fragment>
    )    
  }
  
  const rightToolbarTemplateNone = () => {
    return (
      <React.Fragment>
        <Button
          type="button" 
          label="Voltar" 
          icon="pi pi-left" 
          className="p-button-secondary p-mr-4"
          onClick={goBack} />
      </React.Fragment>
    )
  }

  const fileTemplate = (file, layout) => {
    if (!file) {
        return;
    }

    return (
      <>
        <div className="p-col p-md-9">
          <div className="p-m-2">
            <a href={file.url} target="_blank" rel="noreferrer" download={file.filename}>{file.filename}</a>
          </div>
        </div>
        <div className="p-col p-md-3">
          <div className="p-m-2 p-text-center">
            {file.size != null && <span className="p-tag p-component p-px-1 p-py-1">
              <span className="p-tag-value">{(file.size / 1024).toFixed(2) + " KB"}</span>
            </span>}
          </div>
        </div>
      </>
    );
  }  
 
  return (
    <React.Fragment>
      <h3>Notificação - Edição</h3>

      <form>
        <Toast ref={toast} baseZIndex={2000} />
        { data.id ?
        <React.Fragment>
          <div className="p-grid p-fluid">
            <div className="p-col p-md-9">
              <div className="p-fluid p-formgrid p-grid">
                <div className="p-field p-col-12 p-md-2">
                    <label htmlFor="id">Id</label>
                    <InputText id="id" type="text" value={data.id} disabled />
                </div>
                <div className="p-field p-col-12 p-md-5">
                    <label htmlFor="name">Nome</label>
                    <InputText id="nam" type="text" value={data.name} disabled />
                </div>
                <div className="p-field p-col-12 p-md-5">
                    <label htmlFor="email">Email</label>
                    <InputText id="email" type="text" value={data.email} disabled />
                </div>
                <div className="p-field p-col-12">
                    <label htmlFor="message">Messagem</label>
                    <InputTextarea id="message" rows={5} value={data.message}  autoResize style={{maxHeight: '250px', opacity: '0.6'}} />
                </div>
                <div className="p-field p-col-12">              
                  <label htmlFor="message">Ficheiros</label>
                  <DataView value={data?.files || []} layout="list" 
                    emptyMessage="Não tem ficheiros" itemTemplate={fileTemplate} />                  
                </div>                                                                 
              </div>
            </div>
            <div className="p-col p-md-3">
              <div className="p-fluid p-formgrid p-grid">
                <div className="p-field p-col-12">
                    <label htmlFor="viewer">Visualizador</label>
                    <InputText id="viewer" type="text" value={data.viewer} disabled />
                </div>
                <div className="p-field p-col-12">
                    <label htmlFor="date">Data</label>
                    <InputText id="date" type="text" value={data.date || ''}  disabled />
                </div>                                                
              </div>
            </div>
            <div className="p-col p-md-9">
              <div className="p-fluid p-formgrid p-grid">
                <div className="p-field p-col-12">
                  <label htmlFor="notes">Observações</label>
                  <InputTextarea id="notes" rows={5} autoResize value={data.notes} 
                  onChange={(e) => setData({...data, notes: e.target.value})
                  } />
                </div>
              </div>
            </div>
            <div className="p-col p-md-3">
              <div className="p-fluid p-formgrid p-grid">
                  <div className="p-field p-col-12">
                      <label htmlFor="read_date">Data Leitura</label>
                      <InputText id="read_date" type="text" value={data.checked_date || ''} disabled />
                  </div>
                  <div className="p-field p-col-12">
                      <label htmlFor="close_date">Data Encerramento</label>
                      <InputText id="close_date" type="text" value={data.closed_date || ''} disabled />
                  </div>                               
                </div>              
            </div>
          </div>
          <Toolbar className="p-mt-2 p-mb-4" right={rightToolbarTemplate}></Toolbar>
        </React.Fragment>
        :
        <React.Fragment>
          <Message severity="error" text="Não foi possível obter os dados da notificação." className="p-col p-md-12" />
          <Toolbar className="p-mt-2 p-mb-4" right={rightToolbarTemplateNone}></Toolbar>
        </React.Fragment> }
      </form>
    </React.Fragment>

  );

}

export default connect(state => ({ auth: state.auth }))(NotificationForm);