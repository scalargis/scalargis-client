import React from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Flex, Group } from '@mantine/core';

function Page401() {
  // Routing
  const navigate = useNavigate();

  return (
    <Flex justify="center" style={{ height: '100%' }}>
      <Box p={80} style={{ alignSelf: 'center', backgroundColor: 'white' }}>
        <h1>Ops...</h1>
        <p>Não está autorizado a aceder à página pedida.</p>
        <p>Clique para voltar à página inicial ou para efetuar login</p>
        <Group gap="sm" mt="md">
          <Button onClick={e => navigate("/")}>Página Inicial</Button>
          <Button onClick={e => navigate("/login")}>Entrar</Button>
        </Group>
      </Box>
    </Flex>
  )
}

export default Page401;
