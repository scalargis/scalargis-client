import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './utils';


const cookies = new Cookies();


function RegistrationWidget(props) {

  const { auth, viewer, history, redirect, core, dispatch, actions, record, showLogin } = props;
  
  // Redux redux actions
  const { login_user_registration , logout } = actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  const defaultValues = {
    name: null,
    email: null,
    username: null,
    password: '',
    accept: false
  }

  const passwordStrengthLabels = useMemo(() => {
    return {
      weakLabel: i18nUtils.translateValue("weakPasswordLabel", "Fraca"),
      mediumLabel: i18nUtils.translateValue("mediumPasswordLabel", "Média"),
      strongLabel: i18nUtils.translateValue("strongPasswordLabel", "Forte")
    }
  }, [i18nUtils.getResolvedLanguage()]);

  const { control, formState: { errors }, handleSubmit } = useForm({ defaultValues });


  const TERMS_OF_SERVICE_URL = viewer?.config_json?.terms_of_service_url;

  const onSubmit = (data) => {
    dispatch(login_user_registration({ ...data }, history, redirect));  
  }

  const passwordFooter = (
    <React.Fragment>
        <Divider className="p-mt-2" />
        <p className="p-mt-2">{i18nUtils.translateValue("suggestions", "Sugestões")}:</p>
        <ul className="p-pl-2 p-ml-2 p-mt-0" style={{ lineHeight: '1.5' }}>
            <li>{i18nUtils.translateValue("passwordLowerRule", "Pelo menos uma minúscula")}</li>
            <li>{i18nUtils.translateValue("passwordUpperRule", "Pelo menos uma maiúscula")}</li>
            <li>{i18nUtils.translateValue("passwordDigitRule", "Pelo menos um dígito")}</li>
            <li>{i18nUtils.translateValue("passwordSizeRule", "Pelo menos 8 caracteres")}</li>
        </ul>
    </React.Fragment>
  );
   

  if (auth?.response?.register_user === true && !auth?.response?.error) {
    return (
      <div className="p-d-flex p-ai-center p-dir-col p-pt-6 p-px-3">
        <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>
        <h3>{i18nUtils.translateValue("userRegistrationSuccess", "Registo realizado com sucesso")}!</h3>
        <p style={{ lineHeight: 1.5 }} dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("userRegistrationSuccessMsg", "A sua conta foi criada com o username <b>{{username}}</b>, deverá proceder à sua ativação durante as próximas 24 horas. Por favor, verifique as instruções de ativação da conta enviadas para o email <b>{{email}}</b>.", undefined, undefined, undefined, {username: auth?.response?.username, email: auth?.response?.email})}} />
        {/*
        <Button label="Entrar" onClick={ e=>
          dispatch(login_post({ username: formData.username, password: formData.password }, history, redirect))
        } />
        */}
<       div className='p-col-12 p-md-6 p-p-2 p-text-center'>
          <Button
            className="p-button-link"
            style={{width: 'auto'}}
            label = "Login"
            onClick={ (e) => { e.preventDefault(); showLogin() }}
          />
        </div>        
      </div>      
    ) 
  } 

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <div className="p-fluid p-mt-2">
        <h3>{i18nUtils.translateValue("userRegistrationData", "Dados de registo")}</h3>

        <div className="p-field">
          <span className="p-float-label">
            <Controller name="name" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
            <label htmlFor="name" className={classNames({ 'p-error': errors.name })}>{i18nUtils.translateValue("userRegistrationDataName", "Nome")}*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'name')}
        </div>
        <div className="p-field">
          <span className="p-float-label p-input-icon-right">
            <i className="pi pi-envelope" />
            <Controller name="email" control={control}
                rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório"), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: 'Email inválido. E.g. exemplo@email.pt' }}}
                render={({ field, fieldState }) => (
                    <InputText id={field.name} {...field} disabled={!!cookieData} className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
            <label htmlFor="email" className={classNames({ 'p-error': !!errors.email })}>{i18nUtils.translateValue("userRegistrationDataEmail", "Email")}*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'email')}
        </div>              
        <div className="p-field">
          <span className="p-float-label">
            <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid })} 
                autoComplete="off" />
            )} />
            <label htmlFor="username" className={classNames({ 'p-error': errors.username })}>{i18nUtils.translateValue("userRegistrationDataUsername", "Nome de utilizador")}*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'username')}
        </div>
        <div className="p-field">
          <span className="p-float-label">
              <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                  <Password id={field.name} {...field}
                    toggleMask
                    promptLabel={i18nUtils.translateValue("enterPassword", "Introduza a password")}
                    {...passwordStrengthLabels}
                    className={classNames({ 'p-invalid': fieldState.invalid })} 
                    footer={passwordFooter} 
                    autoComplete="off"
                    aria-autocomplete="none" />
              )} />
              <label htmlFor="password" className={classNames({ 'p-error': errors.password })}>{i18nUtils.translateValue("userRegistrationDataPassword", "Password")}*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'password')}
        </div>
        <div className="p-field-checkbox">
            <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <Checkbox inputId={field.name} onChange={(e) => field.onChange(e.checked)} checked={field.value} className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
            <label htmlFor="accept" className={classNames({ 'p-error': errors.accept })}>{i18nUtils.translateValue("acceptThe", "Aceito os")} <a href={TERMS_OF_SERVICE_URL} target="_blank" rel="noopener noreferrer" className={classNames({ 'p-error': errors.accept })}>{i18nUtils.translateValue("termsAndConditions", "termos e condições de utilização")}</a>*</label>
        </div>        
      </div>

      { showLogin && <div className="p-fluid">
          <div className="p-field p-grid">
            <div className="p-col-12">
              <Button
                className="p-button-link"
                label = "Login"
                onClick={(e) => {
                  e.preventDefault();
                  showLogin();
                }}
              />
            </div>
          </div>          
        </div> }
      
      <div className="p-dialog-myfooter">        
        <Button 
          color='green'
          icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
          label={i18nUtils.translateValue("createUser","Criar utilizador")} 
          type="submit"
          disabled={auth.loading}
        />
      </div>
      
      { auth.http_error && !auth.response &&
        <Message style={{ width: '100%' }} severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}></Message>
      }

      { auth.response && !!auth.response && !!auth.response.message && 
        <Message style={{ width: '100%' }} severity="error" text={auth.response.message}></Message>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.root.auth }))(RegistrationWidget)