import React, { useState, useEffect, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { Divider } from 'primereact/divider';

import { i18n as i18nUtils } from '@scalargis/components';


function PasswordWidget({ core, token, auth, pwd, history, redirect, urlRedirect }) {

  const [mode, setMode] = useState('set');

  const [username, setUsername] = useState();
  const [password, setPassword] = useState('');
  const [goRedirect, setGoRedirect] = useState(false);

  // Enable redux actions
  const dispatch = useDispatch();

  const { utils, siteConfig } = core;
  const { login_reset_password, password_reset_validation, password_post, login_post, logout } = core.actions;

  const defaultValues = {
    newPassword: '',
    confirmPassword: ''
  }
  
  const passwordStrengthLabels = useMemo(() => {
    return {
      weakLabel: i18nUtils.translateValue("weakPasswordLabel", "Fraca"),
      mediumLabel: i18nUtils.translateValue("mediumPasswordLabel", "Média"),
      strongLabel: i18nUtils.translateValue("strongPasswordLabel", "Forte")
    }
  }, [i18nUtils.getResolvedLanguage()]);

  const passwordFooter = useMemo(() => (
    <React.Fragment>
      <Divider className="mt-2" />
      <p className="mt-2">{i18nUtils.translateValue("suggestions", "Sugestões")}:</p>
      <ul className="pl-2 ml-2 mt-0" style={{ lineHeight: '1.5' }}>
        <li>{i18nUtils.translateValue("passwordLowerRule", "Pelo menos uma minúscula")}</li>
        <li>{i18nUtils.translateValue("passwordUpperRule", "Pelo menos uma maiúscula")}</li>
        <li>{i18nUtils.translateValue("passwordDigitRule", "Pelo menos um dígito")}</li>
        <li>{i18nUtils.translateValue("passwordSpecialRule", "Pelo menos um caractere especial")}</li>
        <li>{i18nUtils.translateValue("passwordSizeRule", "Pelo menos 12 caracteres")}</li>
      </ul>
    </React.Fragment>
  ), [i18nUtils.getResolvedLanguage()]);

  useEffect(() => {
    if (auth?.data?.token)  return;
    
    dispatch(password_reset_validation({ token }, history, redirect));
  }, []);

  useEffect(() => {
    if (auth.response && auth.response.valid_token === false) {
      setMode('reset');
    }
  }, [auth]);

  const logo = utils.buildRelativeUrlPath(siteConfig?.logo || 'assets/images/logo.png');

  const { control, watch, formState: { errors }, handleSubmit } = useForm({ defaultValues });
  const watchFields = watch(["newPassword"]);
  

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

  const onSubmit = (data) => {
    setPassword(data.newPassword);
    dispatch(password_post({ token, password: data.newPassword }, history, redirect))
  }

  // Render user
  if (auth?.data?.token) {
    const { username } = auth.data;
    return (
      <React.Fragment>
        {/*
        <div className="text-center mb-5">
            <img src={logo} alt="hyper" height={50} className="mb-3" />
            <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("passwordReset", "Recuperação de password")}</div>
        </div>
        */}
        <p dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("activeUserSession", "Existe uma sessão ativa para o utilizador <i><strong>{ username }</strong></i>.", undefined, undefined, undefined, {username})}} />
        <p>
          {i18nUtils.translateValue("clickTo", "Clique para")} 
          <Button
            className="p-button-link"
            label={i18nUtils.translateValue("endSession", "Terminar sessão")}
            onClick={e => dispatch(logout())}
          />{i18nUtils.translateValue("andChangePassword", "e fazer a alteração da palavra-passe")}.
        </p>
      </React.Fragment>
    )
  }

  if (pwd.response && !!pwd.response && !!pwd.response.authenticated) {
    const username = pwd.response.username;

    return (
        <div>
          <div className="p-fluid w-full my-4 text-center">
            <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>
            <p style={{ lineHeight: 1.5 }}>{i18nUtils.translateValue("changePasswordConfirmationSuccess", "A Palavra-passe foi alterada com sucesso")}!</p>
            <Button label={i18nUtils.translateValue("continue", "Continuar")}
              onClick={ e => {
                setGoRedirect(true);
                const apiUrl = siteConfig?.authentication?.endpoints?.login;
                dispatch(login_post(core, { username, password }, apiUrl, history, redirect, urlRedirect));
              }}
              icon={ goRedirect ? "pi pi-spin pi-spinner": "pi pi-check" }
              disabled={goRedirect} />
          </div>
        </div>
    )
  }

  if (mode === 'reset') {
    if (auth?.response?.reset_password) {
      return (
        <div>
          <div className="p-fluid w-full my-4">
            <Message severity="info" text={auth.response.message}></Message> 
          </div>
          <div className="flex justify-content-end mt-4 mb-4 p-dialog-myfooter">
            <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
              onClick={(e) => history.navigate('/login?redirect=' + (redirect || '/'))}>
                {i18nUtils.translateValue("login", "Login")}
            </a>                         
          </div>
        </div>
      )
    } else {
      return (
        <React.Fragment>
          <div className="text-center mb-5">
            <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("passwordReset", "Recuperação de password")}</div>
            <span className="text-600 font-medium line-height-3"
              dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("passwordResetSendEmail", "Indique o seu <i>username</i> ou <i>email</i> para receber um email com instruções para alterar a palavra-passe.")}} />
          </div>

          <div>
            <label htmlFor="username" className="block text-900 font-medium my-2">{`${i18nUtils.translateValue("user", "Utilizador")} / E-mail`}</label>
            <InputText
              className="w-full mb-1"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            { username == '' && getFormValidationErrorMessage({username: {type: "required", message: "Campo obrigatório"}}, "username") }

            <div className="flex justify-content-end mt-4 mb-4">
                <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
                  onClick={(e) => history.navigate('/login?redirect=' + (redirect || '/'))}>
                    {i18nUtils.translateValue("login", "Login")}
                </a>                         
            </div>

            { auth.http_error && !auth.response &&
                <div className="p-fluid w-full my-4">
                    <Message severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço indisponível")}></Message>
                </div>
            }

            { auth.response && !!auth.response && !!auth.response.message && 
              <div className="p-fluid w-full my-4">
                <Message severity={auth.http_error ? "error" : "info"} text={auth?.response?.message}></Message>
              </div>
            }

            <div className="flex align-items-center justify-content-between mt-4 mb-4 p-dialog-myfooter">
                <Button 
                    label={i18nUtils.translateValue("send", "Enviar")}
                    icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                    className="w-full"
                    onClick={(e)=> { 
                      e.preventDefault();
                      if (!username) { 
                        setUsername('');
                        return;
                      }
                      dispatch(login_reset_password({ username }, history, redirect));}
                    }
                    disabled={auth.loading}
                />                            
            </div>
          </div>
        </React.Fragment>
      )
    }
  }

  if (mode === 'set') {

    return (
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="text-center mb-5">
              <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("passwordReset", "Recuperação de password")}</div>
              <span className="text-600 font-medium line-height-3">{i18nUtils.translateValue("passwordResetIntroMsg", "Por favor, defina e confirme a sua nova palavra-passe.")}</span>
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-900 font-medium my-2">{i18nUtils.translateValue("newPassword", "Nova password")}</label>
            <Controller name="newPassword" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                <Password id={field.name} {...field}
                    toggleMask
                    promptLabel={i18nUtils.translateValue("enterPassword", "Introduza a password")}
                    {...passwordStrengthLabels}
                    footer={passwordFooter}
                    className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                    inputClassName="w-full"
                    pt={{ iconField: { root: { className: 'w-full' } } }}
                    autoComplete="off"
                    aria-autocomplete="none"
                    disabled={auth?.response?.success} />                  
            )} />
            {getFormValidationErrorMessage(errors, 'newPassword')}

            <label htmlFor="confirmPassword" className="block text-900 font-medium my-2">{i18nUtils.translateValue("confirmPassword", "Confirmar password")}</label>
            <Controller name="confirmPassword" control={control} 
                rules={{ 
                    required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
                    validate: (value) => {
                        if (value && watchFields[0] && value != watchFields[0]) {
                            return i18nUtils.translateValue("noMatchingPasswords", "As passwords introduzidas não são iguais");
                        }
                        return true;
                    }
                }} 
                render={({ field, fieldState }) => (
                <Password id={field.name} {...field}
                    feedback={false}
                    toggleMask 
                    promptLabel={i18nUtils.translateValue("confirmPassword", "Confirmar password")}
                    className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                    inputClassName="w-full"
                    pt={{ iconField: { root: { className: 'w-full' } } }}
                    autoComplete="off"
                    aria-autocomplete="none"
                    disabled={auth?.response?.success} />
                )} 
            />
            {getFormValidationErrorMessage(errors, 'confirmPassword')}

            <div className="flex justify-content-end mt-4 mb-4">
                <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
                  onClick={(e) => history.navigate('/login?redirect=' + (redirect || '/'))}>
                    {i18nUtils.translateValue("login", "Login")}
                </a>                         
              </div>

            { pwd.http_error && !pwd.response &&
                <div className="p-fluid w-full my-4">
                <Message severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço indisponível")}></Message>
                </div>
            }

            { pwd.response && !!pwd.response && !pwd.authenticated && !!pwd.response.message &&
                <div className="p-fluid w-full my-4">
                <Message severity="error" text={pwd?.response?.message}></Message>
                </div>
            }                        
            
            <div className="flex justify-content-end mt-4 mb-4 p-dialog-myfooter">
                <Button 
                    label={i18nUtils.translateValue("accept", "Aceitar")}
                    icon={ pwd.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                    className="w-full"
                    disabled={pwd.loading} 
                />                            
            </div>
          </div>
        </form>
    )
  }
}

export default connect(state => ({ auth: state.root.auth, pwd: state.root.password }))(PasswordWidget)