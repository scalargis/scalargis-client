import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { Box, Button, Flex, Group } from '@mantine/core';
import AppContext from '../../AppContext';

function Page401() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const logged = useSelector(state => !!state.auth?.data?.token);

  return (
    <Flex justify="center" style={{ height: '100%' }}>
      <Box p={80} style={{ alignSelf: 'center', backgroundColor: 'white' }}>
        <h1>Ops...</h1>
        <p>Não está autorizado a aceder à página pedida.</p>
        {logged
          ? <p>Clique para voltar à página inicial ou para entrar com outra conta</p>
          : <p>Clique para voltar à página inicial ou para efetuar login</p>}
        <Group gap="sm" mt="md">
          <Button onClick={e => navigate("/")}>Página Inicial</Button>
          {logged
            ? <Button onClick={e => { dispatch(core.actions.session_clear()); navigate("/login", { replace: true }); }}>Terminar sessão</Button>
            : <Button onClick={e => navigate("/login")}>Entrar</Button>}
        </Group>
      </Box>
    </Flex>
  )
}

export default Page401;
