import React, { useContext, useEffect, useState } from 'react'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import { Message } from 'primereact/message'

const cookies = new Cookies();

function LoginWidget({ auth, history, redirect, path, urlRedirect }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { login_post, login_clear_error, logout } = core.actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  useEffect(() => {
    dispatch(login_clear_error());
  }, []);
  
  // Render user
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

  function submit(e) {
    e.preventDefault();
    dispatch(login_post({ username, password }, history, path ? path + redirect : redirect, urlRedirect))
  }

  return (
    <form onSubmit={e => submit()}>

      <div className="p-fluid">

        <div className="field grid">
          <label className="col-12 md:col-4">Nome de Utilizador / E-mail</label>
          <div className="col-12 md:col-8">
            <InputText
              value={username}
              placeholder="Nome de Utilizador"
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="field grid">
          <label className="col-12 md:col-4">Palavra-passe</label>
          <div className="col-12 md:col-8">
            <Password
              value={password}
              placeholder="Palavra-passe"
              feedback={false}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

      </div>

      <div className="p-dialog-myfooter">
        <Button 
          color='green'
          icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
          label="Entrar" 
          onClick={submit}
          disabled={auth.loading}
        />
      </div>
      
      { auth.http_error && !auth.response &&
        <Message style={{ width: '100%' }} severity="error" text="Serviço Indisponível"></Message>
      }

      { auth.response && !!auth.response && !!auth.response.message && 
        <Message style={{ width: '100%' }} severity="error" text="Nome de Utilizador ou Palavra-passe inválido"></Message>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.root.auth }))(LoginWidget)