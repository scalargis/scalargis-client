import React, { useContext, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

function ParameterForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const parameters_table = props.parametersTable || 'site';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const [codeValue, setCodeValue] = useState('');

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
      notes: formData.notes,
      setting_value: formData.setting_value
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal/settings');      
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update(parameters_table, params).then(d => {       
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
      provider.create(parameters_table, params).then(d => {
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
      let msg;

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
              <InputText id="id" type="text" value={data.id || ''} disabled  className="w-full" />
            </div>              

            <div className="field col-12 md:col-3">
              <label htmlFor="code">Código</label>
              <InputText id="code" name="code" {...register('code', { required: 'Campo obrigatório.' })} autoFocus
               className={classNames({ 'w-full': true, 'p-invalid': errors.code })} />
              {getFormErrorMessage(errors, 'code')}
            </div>           

            <div className="field col-12 md:col-7">
              <label htmlFor="name">Designação</label>        
              <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })}
               autoFocus className={classNames({ 'w-full': true, 'p-invalid': errors.name })} />
              {getFormErrorMessage(errors, 'name')}
            </div>

            <div className="field col-12">
              <label htmlFor="notes">Descrição</label>        
              <InputText className="w-full" id="notes" name="notes" {...register('notes')} autoFocus />
              {getFormErrorMessage(errors, 'notes')}
            </div>

            <div className="field col-12">
              <label htmlFor="setting_value">Valor</label>
              <InputTextarea rows={25} id="notes" name="setting_value" {...register('setting_value', { required: 'Campo obrigatório.' })} autoFocus className={classNames({'w-full': true, 'p-invalid': errors.setting_value })} />
              {getFormErrorMessage(errors, 'setting_value')}
            </div>

          </div>

        <Toolbar className="mt-4 mb-4" end={rightToolbarTemplate}></Toolbar>

      </form>
  );

}

export default connect(state => ({}))(ParameterForm);