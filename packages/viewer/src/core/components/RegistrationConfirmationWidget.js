import React, { useContext, useState, useEffect } from 'react'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import { Message } from 'primereact/message'

import { i18n as i18nUtils } from '@scalargis/components';

const cookies = new Cookies();

function RegistrationConfirmationWidget({ token, auth, registration, history, redirect, urlRedirect }) {

  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [goRedirect, setGoRedirect] = useState(false);

  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { registration_confirmation, registration_send_confirmation, login, logout } = core.actions;


  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  useEffect(() => {
    if (cookieData)  return;
 
    dispatch(registration_confirmation({ token }, history, redirect));
  }, []);

  // Render user
  if (cookieData) {
    const { username } = cookieData;
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
      <div className="flex justify-content-center p-dir-col p-px-3">
        <h3>{i18nUtils.translateValue("createUser", "Criar utilizador")}</h3>
        <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>        
        <p style={{ lineHeight: 1.5 }}>{i18nUtils.translateValue("userRegistrationConfirmationSuccess", "Registo de utilizador confirmado com sucesso")}!</p>
        <Button label={i18nUtils.translateValue("continue", "Continuar")} 
          onClick={ e => {
            setGoRedirect(true);
            dispatch(login(registration.response, history, redirect, urlRedirect));
          }}
          icon={ goRedirect ? "pi pi-spin pi-spinner": "pi pi-check" }
          disabled={goRedirect} />
      </div>
    )
  }

  return (
    <React.Fragment>
      { auth.http_error && !auth.response &&
        <Message style={{ width: '100%' }} severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}></Message>
      }

      { auth.http_error && auth.response && !!auth.response.message && 


        <React.Fragment>
          <div className="p-fluid" style={{"maxWidth": "500px"}}>

            <div className="field grid">
              <div className="col-12">
                <h3>{i18nUtils.translateValue("userRegistrationConfirmation", "Confirmação de registo de utilizador")}</h3>
              </div>
            </div>

            <div className="field grid">
              <div className="col-12 ">
                <Message style={{ width: '100%' }} severity="error" text={auth.response.message}></Message> 
              </div>
            </div>

            <div className="field grid">
              <div className="col-12">{i18nUtils.translateValue("userRegistrationFillEmail", "Indique o email utilizado no registo do utilizador para que seja enviada nova confirmação de registo")}.</div>
            </div>                     

            <div className="field grid">
              <label className="col-12 md:col-2">{i18nUtils.translateValue("email", "Email")}</label>
              <div className="col-12 md:col-10">
                <InputText value={emailConfirmation} onChange={(e) => setEmailConfirmation(e.target.value)} />
              </div>
            </div>         
          </div>

          <div className="p-dialog-myfooter">
            <Button 
              color='green'
              icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
              label={i18nUtils.translateValue("send", "Enviar")}
              onClick={sendEmailConfirmation}
              disabled={auth.loading}
            />
          </div>
        </React.Fragment>

      }

      { !auth.http_error && auth.response && !!auth.response.message && 
          <div className="p-fluid" style={{"maxWidth": "500px"}}>
            <div className="field grid">
              <div className="col-12">
                <h3>{i18nUtils.translateValue("userRegistrationConfirmation", "Confirmação de registo de utilizador")}</h3>
              </div>
            </div>
            <Message style={{ width: '100%' }} severity="info" text={auth.response.message}></Message>
          </div>
      }


    </React.Fragment>
  )
}

export default connect(state => ({ auth: state.root.auth, registration: state.root.registration }))(RegistrationConfirmationWidget)