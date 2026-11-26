import React, { useContext, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Alert, Box, Button, Flex, Group, PasswordInput, TextInput } from '@mantine/core';
import { IconCheck, IconXCircle } from '@scalargis/ui';

import AppContext from '../../AppContext';


function LoginWidget({ auth, history, redirect }) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { login_post } = core.actions;

  function submit(e) {
    e.preventDefault();
    dispatch(login_post({ username, password }, history, redirect))
  }

  return (
    <form onSubmit={submit}>

      <Flex direction="column">
        <Box mb="sm">
          <TextInput
            id="username"
            label="Nome de Utilizador / E-mail"
            placeholder="Nome de Utilizador"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </Box>

        <Box mb="sm">
          <PasswordInput
            id="password"
            label="Palavra-passe"
            placeholder="Palavra-passe"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </Box>
      </Flex>

      <div className="dialog-footer">
        <Button
          type="submit"
          leftSection={<IconCheck />}
          loading={auth.loading}>Entrar</Button>
      </div>

      { auth.error === 'unavailable' &&
        <Box pt="md">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconXCircle />
              <span>Serviço Indisponível</span>
            </Group>
          </Alert>
        </Box>
      }

      { auth.error === 'rejected' &&
        <Box pt="md">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconXCircle />
              <span>Nome de Utilizador ou Palavra-passe inválido</span>
            </Group>
          </Alert>
        </Box>
      }

    </form>
  )
}

export default connect(state => ({ auth: state.auth }))(LoginWidget)
