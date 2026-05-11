import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

import { i18n as i18nUtils } from '@scalargis/components';


function RegistrationConfirmationWidget({ core, token, auth, registration, history, redirect, urlRedirect }) {

  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [goRedirect, setGoRedirect] = useState(false);

  // Enable redux actions
  const dispatch = useDispatch();

  const { utils, siteConfig } = core;
  const { registration_confirmation, registration_send_confirmation, login, logout } = core.actions;

  useEffect(() => {
    if (auth?.data?.token) return;
 
    dispatch(registration_confirmation({ token }, history, redirect));
  }, []);

  // Render user
  if (auth?.data?.token) {
    const { username } = auth.data;
    
    return (
        <div>
            <p dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("activeUserSession", "Existe uma sessão ativa para o utilizador <i><strong>{{username}}</strong></i>", undefined, undefined, undefined, {username: username})}} />
            <p>
              {i18nUtils.translateValue("clickTo", "Clique para ")}
              <Button
                className="p-button-link"
                label={i18nUtils.translateValue("endSession", "terminar sessão").toLowerCase()}
                onClick={e => dispatch(logout())}
              />{i18nUtils.translateValue("andFinishUserRegistration", "e concluir registo de novo utilizador")}.
            </p>
          </div>
    )
  }

  const sendEmailConfirmation = () => {    
    dispatch(registration_send_confirmation({ email: emailConfirmation }, history, redirect));
  }

  if (registration.response && !!registration.response && !!registration.response.authenticated) {
    return (
      <div>
          <div className="flex align-items-center justify-content-center flex-column px-3">
            <h3>{i18nUtils.translateValue("createUser", "Criar utilizador")}</h3>
            <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>        
            <p style={{ lineHeight: 1.5 }}>{i18nUtils.translateValue("userRegistrationConfirmationSuccess", "Registo de utilizador confirmado com sucesso")}!</p>
            <Button className=" my-3" 
              label={i18nUtils.translateValue("continue", "Continuar")} 
              onClick={ e => {
                setGoRedirect(true);
                dispatch(login(registration.response, history, redirect, urlRedirect));
              }}
              icon={ goRedirect ? "pi pi-spin pi-spinner": "pi pi-check" }
              disabled={goRedirect} />
          </div>
        </div>
    )
  }

  return (
    <React.Fragment>
      <div className="text-center mb-2">
        <div className="text-900 text-2xl font-medium mb-3">{i18nUtils.translateValue("userRegistrationConfirmation", "Confirmação de registo de utilizador")}</div>
        <span className="text-900 font-medium line-height-3">{i18nUtils.translateValue("userRegistrationFillEmail", "Indique o email utilizado no registo do utilizador para que seja enviada nova confirmação de registo")}.</span>
      </div>

      <div>
        <label htmlFor="username" className="block text-900 font-medium my-2">{i18nUtils.translateValue("email", "Email")}</label>
        <InputText value={emailConfirmation} onChange={(e) => setEmailConfirmation(e.target.value)} className="w-full mb-1" />

        <div className="flex justify-content-end mt-4 mb-4">
            <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
              onClick={() => {
                history.navigate('/login?redirect=' + (redirect || '/'));
              }} >
                {i18nUtils.translateValue("login", "Login")}
            </a>                         
        </div>

        { auth.http_error && auth.response && !!auth.response.message &&
          <div className="p-fluid w-full my-4">
            <Message style={{ width: '100%' }} severity="error" text={auth.response.message}></Message> 
          </div>
        }

        { auth.http_error && !auth.response &&
          <div className="p-fluid w-full my-4">
            <Message style={{ width: '100%' }} severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}></Message>
          </div>
        }

        { !auth.http_error && auth.response && !!auth.response.message &&
          <div className="p-fluid w-full my-4">
            <Message style={{ width: '100%' }} severity="info" text={auth.response.message}></Message>
          </div>
        }

        <div className="flex align-items-center justify-content-between mt-4 mb-4 p-dialog-myfooter">
          <Button 
            icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
            label={i18nUtils.translateValue("send", "Enviar")}
            onClick={sendEmailConfirmation}
            className="w-full"
            disabled={auth.loading}
          />
        </div>
      </div>
    </React.Fragment>
  )
}

export default connect(state => ({ auth: state.root.auth, registration: state.root.registration }))(RegistrationConfirmationWidget)