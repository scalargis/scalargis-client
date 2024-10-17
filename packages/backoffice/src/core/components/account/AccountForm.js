import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { ToggleButton } from 'primereact/togglebutton';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { ListBox } from 'primereact/listbox';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { v4 as uuidV4 } from 'uuid'

import AppContext from '../../../AppContext';
import useFormFields from '../../useFormFields';
import dataProvider from '../../../service/DataProvider';

const sortRolesArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

const sortGroupsArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

function AccountForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const toast = useRef(null);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  const goBack = () => {
    /*
    const location = {
      pathname: location.state.from,
      state: { 
        searchParams: {...location.state.previousSearchParams}
      }
    }
    location.replace(location);
    */
    const state = { 
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { replace: true, state })
    //history.goBack();
  }  

  const onSubmit = (formData) => {
    const new_data = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password || null
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/security');      
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('users', params).then(d => {       
        toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});
        setValue('password', '', {
          shouldValidate: true,
          shouldDirty: true
        });
      }).catch(e => {
        toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});        
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('users', params).then(d => {
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

      <div className="p-fluid p-formgrid p-grid">
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="first_name">Primeiro Nome</label>
          <InputText id="first_name" name="first_name" {...register('first_name')} autoFocus />
        </div>            
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="last_name">Último Nome</label>
          <InputText id="last_name" name="last_name" {...register('last_name')} />
        </div>
        <div className="p-field p-col-12 p-md-6">
          <label htmlFor="name">Nome</label>
          <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.name })} />
          {getFormErrorMessage(errors, 'name')}
        </div>

        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="username">Username</label>
          <InputText id="username" name="username" {...register('username', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.username })} />
          {getFormErrorMessage(errors, 'username')}
        </div>
        <div className="p-field p-col-12 p-md-4">
          <label htmlFor="email">Email</label>
          <InputText id="email" name="email" {...register('email', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.email })} />
          {getFormErrorMessage(errors, 'email')}
        </div>
        <div className="p-field p-col-12 p-md-4">
          <label htmlFor="password">Password</label>
          <Controller
            control={control}
            name="password"
            render={({ field }) => {
              return <Password {...field} feedback={false}  onChange={(e) => field.onChange(e.target.value)} />
            }} 
          />
        </div>

        <div className="p-field p-col-12 p-md-6">
          <label htmlFor="auth_token">Token de Autenticação</label>
          <div className="p-inputgroup">
              <Button type="button" label="Gerar" icon="pi pi-check" className="p-button-primary" onClick={(e) => { setValue('auth_token', String(uuidV4())); } } />
              <InputText id="auth_token" name="auth_token" {...register('auth_token')} placeholder="Token não definido" />
              <Button type="button" icon="pi pi-times" className="p-button-danger" onClick={(e) => { setValue('auth_token', null); setValue('auth_token_expire', null); } } />                
          </div>
        </div>
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="auth_token_expire">Data de Validade do Token</label>
          <div className="p-inputgroup">
              <Controller
                control={control}
                name="auth_token_expire"
                render={({ field }) => {              
                  return <Calendar {...field} 
                    dateFormat="yy-mm-dd"
                    onChange={(e) => field.onChange(e.target.value)} 
                    showIcon showTime showSeconds />
                }} 
              />                    
              <Button type="button" icon="pi pi-times" className="p-button-danger" onClick={(e) => setValue('auth_token_expire', null) } />
          </div>
        </div>

      </div>

      <Toolbar className="p-mt-4 p-mb-4" right={rightToolbarTemplate}></Toolbar>

    </form>
  );

}

export default connect(state => ({}))(AccountForm);