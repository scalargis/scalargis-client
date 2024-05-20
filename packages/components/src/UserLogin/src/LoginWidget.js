import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import Cookies from 'universal-cookie'
import { useForm, Controller } from 'react-hook-form'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { classNames } from 'primereact/utils'

import { i18n as i18nUtils } from '@scalargis/components'

import { getFormValidationErrorMessage } from './utils'

const cookies = new Cookies();

function LoginWidget(props) {

  const { auth, history, redirect, core, dispatch, actions, record, showRegistration, showPasswordReset } = props;

  const componentCfg = record.config_json || {};
  
  // Redux actions
  const { login_post, login_clear_error, logout } = actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  const defaultLoginValues = {
    username: '',
    password: ''
  }

  const { control, formState: { errors }, trigger, getValues, setValue, handleSubmit } = useForm({ defaultLoginValues });

  useEffect(() => {
    dispatch(login_clear_error());
  }, []);
  
  if (cookieData) {
    const { username } = cookieData;
    return (
      <div>
        <p>Olá { username }.</p>
        <p>
          Clique para 
          <Button
            className="p-button-link" onClick={e => dispatch(logout())}
            label={i18nUtils.translateValue("endSession", "Terminar sessão")}
          />.
        </p>
      </div>
    )
  }

  const checkKeyDown =  async (e) => {
    if (e.code === 'Enter') {
      e.preventDefault();
      const result = await trigger(["username", "password"]);
      if (result) {
        onSubmit(getValues());
      }
    }
  };

  const onSubmit = (data) => {
    if (record?.config_json?.actions?.login) {
      core.pubsub.publish(record?.config_json?.actions?.login, null);
      return;
    }      
    dispatch(login_post({ username: data.username, password: data.password }, history, redirect));
  }

  console.log(auth?.response?.message);

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <div className="p-fluid">
        <div className="p-field p-grid">
          <label htmlFor="username" className="p-col-12 p-md-4">{`${i18nUtils.translateValue("user", "Utilizador")} / E-mail`}</label>
          <div className="p-col-12 p-md-8">
            <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
                <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid })}
                  autoComplete="off"
                  aria-autocomplete="none"
                  onKeyPress={checkKeyDown} />
              )} />
            {getFormValidationErrorMessage(errors, 'username')}
          </div>
        </div>

        <div className="p-field p-grid">
          <label htmlFor="password" className="p-col-12 p-md-4">{i18nUtils.translateValue("password", "Palavra-passe")}</label>
          <div className="p-col-12 p-md-8">
            <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
              <Password id={field.name} {...field} 
                toggleMask 
                feedback={false} 
                className={classNames({ 'p-invalid': fieldState.invalid })}
                autoComplete="off"
                aria-autocomplete="none"
                onKeyPress={checkKeyDown} />                  
                )} />
            {getFormValidationErrorMessage(errors, 'password')}
          </div>
        </div>

        { (componentCfg.reset_password === true || componentCfg.reset_password_login_error === true || componentCfg.user_registration) && <div className="p-field p-grid p-text-center">
          { (componentCfg.reset_password || (componentCfg.reset_password_login_error && auth.response && !!auth.response && !!auth.response.message)) && <div className={`p-col p-p-2 p-text-center`}>
            <Button
              className="p-button-link"
              style={{width: 'auto'}}
              label={i18nUtils.translateValue("passwordReset", "Recuperar password")}
              onClick={ (e) => { e.preventDefault(); showPasswordReset() }}
            />
          </div> }
          { componentCfg.user_registration && <div className='p-col p-p-2 p-text-center'>
            <Button
              className="p-button-link"
              style={{width: 'auto'}}
              label={i18nUtils.translateValue("userRegistration", "Novo utilizador")}
              onClick={ (e) => { e.preventDefault(); showRegistration() }}
            />
          </div> }          
        </div> }
      </div>

      <div className="p-dialog-myfooter">
        <Button
          type="submit" 
          color='green'
          icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
          label={i18nUtils.translateValue("login", "Entrar")}
          disabled={auth.loading}
        />
      </div>
      
      { auth.http_error && !auth.response &&
        <Message style={{ width: '100%' }} severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço indisponível")}></Message>
      }

      { auth.response && !!auth.response && !!auth.response.message && 
        <Message style={{ width: '100%' }} severity="error" text={auth?.response?.message}></Message>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.root.auth }))(LoginWidget)