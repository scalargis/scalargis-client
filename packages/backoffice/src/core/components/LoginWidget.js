import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import { Message } from 'primereact/message'

const cookies = new Cookies();

function LoginWidget({ auth, history, redirect }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { login_post, logout } = core.actions;

  const cookieAuthName = core.COOKIE_AUTH_NAME;

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
      
      <div className="flex flex-column">
        <div className="field">
          <label for="username">Nome de Utilizador / E-mail</label>
          <InputText
            id="username"
            className="block w-full"
            value={username}
            placeholder="Nome de Utilizador"
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="field">
          <label for="password">Palavra-passe</label>
          <Password
            id="password"
            className="block"
            inputClassName="w-full"
            value={password}
            placeholder="Palavra-passe"
            feedback={false}
            toggleMask
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="dialog-footer">
        <Button 
          color='green'
          icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
          label="Entrar" 
          onClick={submit}
          disabled={auth.loading}
        />
      </div>
      
      { auth.http_error && !auth.response &&
        <div className="p-fluid p-fluid pt-4">
          <Message severity="error" text="Serviço Indisponível"></Message>
        </div>
      }

      { auth.response && !!auth.response && !!auth.response.message &&
        <div className="p-fluid pt-4"> 
          <Message severity="error" text="Nome de Utilizador ou Palavra-passe inválido"></Message>
        </div>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.auth }))(LoginWidget)