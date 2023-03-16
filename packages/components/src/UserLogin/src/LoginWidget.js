import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import Cookies from 'universal-cookie'
import { useForm, Controller } from 'react-hook-form'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { classNames } from 'primereact/utils'

const cookies = new Cookies();

function LoginWidget(props) {

  const { auth, history, redirect, core, dispatch, actions, record, showRegistration } = props;

  const componentCfg = record.config_json || {};

  const [mode, setMode] = useState('login');
  
  // Redux actions
  const { login_post, login_clear_error, login_reset_password, logout } = actions;

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
            label="terminar sessão"
          />.
        </p>
      </div>
    )
  }

  function switchPasswordResetMode(e) {
    e.preventDefault();
    setValue('username', '');
    setValue('password', '');
    setMode('password_reset');
    dispatch(login_clear_error());
  }

  function switchLoginMode(e) {
    e.preventDefault();
    setValue('username', '');
    setValue('password', '');    
    setMode('login');
    dispatch(login_clear_error());
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
    if (mode === 'password_reset') {
      if (record?.config_json?.actions?.reset_password) {
        core.pubsub.publish(record?.config_json?.actions?.reset_password, {post: { username: data.username, redirect }, history, redirect});
        return;
      }
      dispatch(login_reset_password({ username: data.username, redirect }, history, redirect));
    } else {
      if (record?.config_json?.actions?.login) {
        core.pubsub.publish(record?.config_json?.actions?.login, null);
        return;
      }      
      dispatch(login_post({ username: data.username, password: data.password }, history, redirect));
    }
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

  if (mode === 'password_reset' && auth?.response?.reset_password === true && !auth?.response?.error) {
    return (
      <React.Fragment>

        <div className="p-fluid">

          <div className="p-d-flex p-ai-center p-dir-col p-pt-2 p-px-3">
            <h3>Recuperação de palavra-passe</h3>
            <p>{auth.response.message}</p>
            <p style={{fontSize: "0.9rem"}}>Caso não receba o email com as instruções para recuperação da palavra-passe durante os próximos minutos, verifique se este não foi direcionado para a área de SPAM do seu correio eletrónico.</p>
          </div> 

          <div className="p-field p-grid">
            <div className="p-col-12">
              <Button
                className="p-button-link"
                label = "Login"
                onClick={switchLoginMode}
              />
            </div>
          </div>          
        </div>

        <div className="p-dialog-myfooter">
          <Button 
            color='green'
            icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
            label="Fechar" 
            onClick={(e) => {
              setMode('login');
              props.onHide();
            }}
          />
        </div>

      </React.Fragment>        
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <div className="p-fluid">
        <div className="p-field p-grid">
          <label htmlFor="username" className="p-col-12 p-md-4">Utilizador / E-mail</label>
          <div className="p-col-12 p-md-8">
            <Controller name="username" control={control} rules={{ required: 'Preenchimento obrigatório.' }} render={({ field, fieldState }) => (
                <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid })}
                  autoComplete="off"
                  aria-autocomplete="none"
                  onKeyPress={checkKeyDown} />
              )} />
            {getFormValidationErrorMessage(errors, 'username')}
          </div>
        </div>

        { mode === 'login' && 
          <React.Fragment>
            <div className="p-field p-grid">
              <label htmlFor="password" className="p-col-12 p-md-4">Palavra-passe</label>
              <div className="p-col-12 p-md-8">
              <Controller name="password" control={control} rules={{ required: 'Preenchimento obrigatório.' }} render={({ field, fieldState }) => (
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

            { (componentCfg.reset_password === true || componentCfg.user_registration) && <div className="p-field p-grid">
              { (!componentCfg.reset_password  || !componentCfg.user_registration) && <div className='p-col-12 p-md-6' />}
              { componentCfg.reset_password && <div className={'p-col-12 p-md-6 p-p-2 p-text-center'}>
                <Button
                  className="p-button-link"
                  style={{width: 'auto'}}
                  label = "Recuperar palavra-passe"
                  onClick={switchPasswordResetMode}
                />
              </div> }
              { componentCfg.user_registration && <div className='p-col-12 p-md-6 p-p-2 p-text-center'>
                <Button
                  className="p-button-link"
                  style={{width: 'auto'}}
                  label = "Novo utilizador"
                  onClick={ (e) => { e.preventDefault(); showRegistration() }}
                />
              </div> }          
            </div> }
          </React.Fragment>
        }

        { mode === 'password_reset' && 
          <div className="p-field p-grid">
            <div className="p-col-12 p-text-center">
              <Button
                className="p-button-link"
                style={{width: 'auto'}}
                label = "Login"
                onClick={switchLoginMode}
              />
            </div>
          </div>
        }        

      </div>

      <div className="p-dialog-myfooter">
        <Button
          type="submit" 
          color='green'
          icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
          label={ mode === "password_reset" ? "Enviar" : "Entrar" }
          disabled={auth.loading}
        />
      </div>
      
      { auth.http_error && !auth.response &&
        <Message style={{ width: '100%' }} severity="error" text="Serviço Indisponível"></Message>
      }

      { auth.response && !!auth.response && !!auth.response.message && 
        <Message style={{ width: '100%' }} severity="error" text={auth?.response?.message}></Message>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.root.auth }))(LoginWidget)