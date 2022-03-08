import React, { useState } from 'react'
import { connect } from 'react-redux'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'

const cookies = new Cookies();
const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'scalargis';

function LoginWidget({ auth, history, redirect, dispatch, actions }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { login_post, logout } = actions;

  const cookieData = cookies.get(cookieAuthName);
  
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
    dispatch(login_post({ username, password }, history, redirect))
  }

  return (
    <form onSubmit={e => submit()}>

      <div className="p-fluid">

        <div className="p-field p-grid">
          <label className="p-col-12 p-md-4">Nome de Utilizador / E-mail</label>
          <div className="p-col-12 p-md-8">
            <InputText
              value={username}
              placeholder="Nome de Utilizador"
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="p-field p-grid">
          <label className="p-col-12 p-md-4">Palavra-passe</label>
          <div className="p-col-12 p-md-8">
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