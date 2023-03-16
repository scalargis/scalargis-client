import React from 'react';
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

const cookies = new Cookies();

const passwordStrengthLabels = {
  weakLabel: 'Fraca',
  mediumLabel: 'Média',
  strongLabel: 'Forte'
}

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

  // Render user
  if (cookieData) {
    console.log(cookieData);
  }

  const { control, formState: { errors }, handleSubmit } = useForm({ defaultValues });


  const TERMS_OF_SERVICE_URL = viewer?.config_json?.terms_of_service_url;

  const onSubmit = (data) => {
    dispatch(login_user_registration({ ...data }, history, redirect));  
  }

  const getFormValidationErrorMessage = (errors, name) => {
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

  const passwordFooter = (
    <React.Fragment>
        <Divider className="p-mt-2" />
        <p className="p-mt-2">Sugestões:</p>
        <ul className="p-pl-2 p-ml-2 p-mt-0" style={{ lineHeight: '1.5' }}>
            <li>Pelo menos uma minúscula</li>
            <li>Pelo menos uma maiúscula</li>
            <li>Pelo menos um dígito</li>
            <li>Pelo menos 8 caracteres</li>
        </ul>
    </React.Fragment>
  );
   

  if (auth?.response?.register_user === true && !auth?.response?.error) {
    return (
      <div className="p-d-flex p-ai-center p-dir-col p-pt-6 p-px-3">
        <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>
        <h3>Registo realizado com sucesso!</h3>
        <p style={{ lineHeight: 1.5 }}>
            A sua conta foi registada com o username <b>{auth?.response?.username}</b>, deverá proceder à sua ativação durante as próximas 24 horas. Por favor, verifique as instruções de ativação da conta enviadas para o email <b>{auth?.response?.email}</b>.
        </p>
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
        <h3>Dados de registo</h3>

        <div className="p-field">
          <span className="p-float-label">
            <Controller name="name" control={control} rules={{ required: 'Campo obrigatório.' }} render={({ field, fieldState }) => (
                <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
            <label htmlFor="name" className={classNames({ 'p-error': errors.name })}>Nome*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'name')}
        </div>
        <div className="p-field">
          <span className="p-float-label p-input-icon-right">
            <i className="pi pi-envelope" />
            <Controller name="email" control={control}
                rules={{ required: 'Campo obrigatório', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: 'Email inválido. E.g. exemplo@email.pt' }}}
                render={({ field, fieldState }) => (
                    <InputText id={field.name} {...field} disabled={!!cookieData} className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
            <label htmlFor="email" className={classNames({ 'p-error': !!errors.email })}>Email*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'email')}
        </div>              
        <div className="p-field">
          <span className="p-float-label">
            <Controller name="username" control={control} rules={{ required: 'Campo obrigatório.' }} render={({ field, fieldState }) => (
                <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid })} 
                autoComplete="off" />
            )} />
            <label htmlFor="username" className={classNames({ 'p-error': errors.username })}>Username*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'username')}
        </div>
        <div className="p-field">
          <span className="p-float-label">
              <Controller name="password" control={control} rules={{ required: 'Campo obrigatório.' }} render={({ field, fieldState }) => (
                  <Password id={field.name} {...field}
                    toggleMask
                    promptLabel="Introduza a password" 
                    {...passwordStrengthLabels}
                    className={classNames({ 'p-invalid': fieldState.invalid })} 
                    footer={passwordFooter} 
                    autoComplete="off"
                    aria-autocomplete="none" />
              )} />
              <label htmlFor="password" className={classNames({ 'p-error': errors.password })}>Password*</label>
          </span>
          {getFormValidationErrorMessage(errors, 'password')}
        </div>
        <div className="p-field-checkbox">
            <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <Checkbox inputId={field.name} onChange={(e) => field.onChange(e.checked)} checked={field.value} className={classNames({ 'p-invalid': fieldState.invalid })} />
            )} />
            <label htmlFor="accept" className={classNames({ 'p-error': errors.accept })}>Aceito os <a href={TERMS_OF_SERVICE_URL} target="_blank" rel="noopener noreferrer" className={classNames({ 'p-error': errors.accept })}>termos e condições de utilização</a>*</label>
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
          label="Registar" 
          type="submit"
          disabled={auth.loading}
        />
      </div>
      
      { auth.http_error && !auth.response &&
        <Message style={{ width: '100%' }} severity="error" text="Serviço Indisponível"></Message>
      }

      { auth.response && !!auth.response && !!auth.response.message && 
        <Message style={{ width: '100%' }} severity="error" text={auth.response.message}></Message>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.root.auth }))(RegistrationWidget)