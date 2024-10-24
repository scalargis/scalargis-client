import React, { useContext, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

function PrintElementForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const toast = useRef(null);

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  const goBack = () => {
    const state = { 
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { state });
  }

  const onSubmit = (formData) => {
    const new_data = {
      code: formData.code,
      name: formData.name,
      config: formData.config
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal');      
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('prints/elements', params).then(d => {       
        toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});
      }).catch(e => {
        toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('prints/elements', params).then(d => {
        setData({...data, id: d.data.id});
        toast.current.show({life: 5000, severity: 'success', summary: 'Criar Registo', detail: 'Registo criada com sucesso'});
      }).catch(e => {
        toast.current.show({life: 5000, severity: 'error', summary: 'Criar Registo', detail: 'Ocorreu um erro ao criar o registo'});
      }).finally(() => {
        setIsSaving(false);
      });       
    }
  };

  const getFormErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'required') {
        return <small className="p-error">{errors[name].message || 'Campo obrigatório'}</small>
      } else if (errors[name].type === 'maxLength') {
         return <small className="p-error">{errors[name].message || 'O número de caracteres é superior à dimensão máxima permitida'}</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="p-error">{errors[name].message || 'Formato inválido'}</small>
      } else {
        return <small className="p-error">{errors[name].message}</small>
      }
    }      
  };  
 
  const rightToolbarTemplate = () => {
    return (
        <React.Fragment>
            <Button
              type="button" 
              label="Voltar" 
              icon="pi pi-left" 
              className="p-button-secondary mr-4"
              disabled={isSaving ? true : false} 
              onClick={goBack} />
            <Button
              type="submit" 
              label="Gravar"
              icon={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
              disabled={isSaving ? true : false} />
        </React.Fragment>
    )
  }

  return (
      <form onSubmit={handleSubmit(onSubmit)}>

          <Toast ref={toast} baseZIndex={2000} />

          <div className="formgrid grid">      
            <div className="field col-12 md:col-2">
              <label htmlFor="id">Id</label>
              <InputText id="id" type="text" value={data.id || ''} disabled className="w-full" />
            </div>              

            <div className="field col-12 md:col-3">
              <label htmlFor="code">Código</label>
              <InputText id="code" name="code" {...register('code', { required: 'Campo obrigatório.' })} autoFocus
               className={classNames({ 'w-full': true, 'p-invalid': errors.code })} />
              {getFormErrorMessage(errors, 'code')}
            </div>           

            <div className="field col-12 md:col-7">
              <label htmlFor="name">Designação</label>        
              <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} autoFocus
               className={classNames({ 'w-full': true, 'p-invalid': errors.name })} />
              {getFormErrorMessage(errors, 'name')}
            </div>

            <div className="field col-12">
              <label htmlFor="config">Configuração</label>        
              <div id="editor-parent">
                <Controller
                  control={control}
                  name="config"
                  rules={{ required: 'Campo obrigatório.' }}
                  render={({ field }) => {
                    return <AceEditor
                      mode="json"
                      theme="github"
                      onLoad={editorInstance => {                
                        editorInstance.container.style.setProperty('width', (document.getElementById('editor-parent').offsetWidth - 50) + 'px');               
                      }}
                      {...field}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                      }}
                      value={field.value}
                      name="config"         
                      editorProps={{ $blockScrolling: true }}
                      setOptions={{
                        useWorker: false,
                        tabSize: 2
                      }}                                 
                    />
                  }}
                />
                {getFormErrorMessage(errors, 'config')}
              </div>            
            </div>
          </div>

        <Toolbar className="mt-4 mb-4" end={rightToolbarTemplate}></Toolbar>

      </form>
  );

}

export default connect(state => ({}))(PrintElementForm);