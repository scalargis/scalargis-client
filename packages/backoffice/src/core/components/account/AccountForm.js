import React, { useContext, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { v4 as uuidV4 } from 'uuid';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import PasswordChange from './PasswordChange';


function AccountForm(props) {

  const {
    history,
    dispatch
  } = props;

  const { core } = useContext(AppContext);

  const { auth_update, logout } = core?.actions;

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const toast = useRef(null);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  const onSubmit = (formData) => {

    const new_data = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      auth_token: formData.auth_token || null,
      auth_token_expire: formData.auth_token_expire || null
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/security');
    const params = {
      data: new_data
    }
    provider.update('account', params).then(d => {       
      toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});

      setData(new_data);

      if (d?.data) dispatch(auth_update(d?.data));

    }).catch(e => {
      const msg = e.message || 'Ocorreu um erro ao alterar o registo';
      toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: msg});        
    }).finally(() => {
      setIsSaving(false);
    });
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
  
  
  const leftToolbarTemplate = () => {
    if (isEditMode ) return null;

    return (
      <Button
        type="button"
        label="Sair"
        icon="pi pi-power-off"
        className="p-button-danger"
        onClick={e => { e.preventDefault(); dispatch(logout()); }} />
    );
  }
 
  const rightToolbarTemplate = () => {
    if (isEditMode) {
      return (
        <React.Fragment>

          <Button
            type="button"
            label="Cancelar"
            className="p-mr-2"
            onClick={e => { 
              e.preventDefault(); 
              setIsEditMode(false);

              Object.entries(data).forEach(([key, val]) => {
                setValue(key, val, {shouldDirty: false, shouldTouch: false, shouldValidate: false});
              });
            }}
            disabled={isSaving ? true : false} />

          <Button
            type="submit" 
            label="Gravar"
            icon={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
            disabled={isSaving ? true : false} />
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        <Button
          type="button"
          label="Editar"
          icon="pi pi pi-pencil"
          onClick={e => { e.preventDefault(); setIsEditMode(true)} } />
      </React.Fragment>
    )

  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <Toast ref={toast} baseZIndex={2000} />

      <div className="p-fluid p-formgrid p-grid">
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="first_name">Primeiro Nome</label>
          <InputText id="first_name" name="first_name" {...register('first_name')} autoFocus disabled={!isEditMode} />
        </div>            
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="last_name">Último Nome</label>
          <InputText id="last_name" name="last_name" {...register('last_name')} disabled={!isEditMode} />
        </div>
        <div className="p-field p-col-12 p-md-6">
          <label htmlFor="name">Nome</label>
          <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} disabled={!isEditMode} className={classNames({ 'p-invalid': errors.name })} />
          {getFormErrorMessage(errors, 'name')}
        </div>

        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="username">Username</label>
          <InputText id="username" name="username" {...register('username', { required: 'Campo obrigatório.' })} disabled={!isEditMode} className={classNames({ 'p-invalid': errors.username })} />
          {getFormErrorMessage(errors, 'username')}
        </div>
        <div className="p-field p-col-12 p-md-4">
          <label htmlFor="email">Email</label>
          <InputText id="email" name="email" {...register('email', { required: 'Campo obrigatório.' })} disabled={!isEditMode} className={classNames({ 'p-invalid': errors.email })} />
          {getFormErrorMessage(errors, 'email')}
        </div>

        { !isEditMode &&
        <div className="p-field p-pl-2">
          <label htmlFor="password">Password</label>
          <PasswordChange core={core} />
        </div>
        }

        <div className="p-field p-col-12 p-md-6">
          <label htmlFor="auth_token">Token de Autenticação</label>
          <div className="p-inputgroup">
              <Button type="button" label="Gerar" icon="pi pi-check" className="p-button-primary" onClick={(e) => {setValue('auth_token', String(uuidV4()));}} disabled={!isEditMode} />
              <InputText id="auth_token" name="auth_token" {...register('auth_token')} placeholder="Token não definido" disabled={!isEditMode} />
              <Button type="button" icon="pi pi-times" className="p-button-danger" onClick={(e) => {setValue('auth_token', null); setValue('auth_token_expire', null);}} disabled={!isEditMode} />                
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
                    showIcon showTime showSeconds
                    disabled={!isEditMode} />
                }} 
              />                    
              <Button type="button" icon="pi pi-times" className="p-button-danger" onClick={(e) => setValue('auth_token_expire', null)} disabled={!isEditMode} />
          </div>
        </div>

      </div>

      <Toolbar className="p-mt-4 p-mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

    </form>
  );

}

export default connect(state => ({}))(withRouter(AccountForm));