import React, { useContext, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Alert, Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core';

import AppContext from '../../AppContext';


function LoginWidget({ auth, history, redirect }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { login_post, logout } = core.actions;

  // Render user
  if (auth?.data?.token) {
    const { username } = auth.data;
    return (
      <div>
        <p>Olá { username }.</p>
        <p>
          Clique para{' '}
          <Anchor component="button" type="button" onClick={e => dispatch(logout())}>
            terminar sessão
          </Anchor>.
        </p>
      </div>
    )
  }

  function submit(e) {
    e.preventDefault();
    dispatch(login_post({ username, password }, history, redirect))
  }

  return (
    <form onSubmit={submit}>

      <div className="flex flex-column">
        <div className="field">
          <TextInput
            id="username"
            label="Nome de Utilizador / E-mail"
            placeholder="Nome de Utilizador"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="field">
          <PasswordInput
            id="password"
            label="Palavra-passe"
            placeholder="Palavra-passe"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="dialog-footer">
        <Button
          type="submit"
          leftSection={<i className="pi pi-check" />}
          loading={auth.loading}>Entrar</Button>
      </div>

      { auth.http_error && !auth.response &&
        <div className="pt-4">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>Serviço Indisponível</span>
            </Group>
          </Alert>
        </div>
      }

      { !!auth.response?.message &&
        <div className="pt-4">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>Nome de Utilizador ou Palavra-passe inválido</span>
            </Group>
          </Alert>
        </div>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.auth }))(LoginWidget)
