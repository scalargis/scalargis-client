import React from 'react';
import { Box, Button, Flex, Group } from '@mantine/core';

const messages = {
  network: 'Não foi possível contactar o servidor.',
  server: 'O servidor respondeu com um erro.',
  invalid: 'O servidor enviou uma resposta inválida.'
};

/** Error page of the backoffice boot, with a retry that keeps the session. */
function PageBootError({ error, onRetry }) {
  const message = messages[error?.kind] || messages.invalid;
  const status = error?.kind === 'server' && error?.status ? ` (HTTP ${error.status})` : '';

  return (
    <Flex justify="center" style={{ height: '100%' }}>
      <Box p={80} style={{ alignSelf: 'center', backgroundColor: 'white' }} role="alert">
        <h1>Ops...</h1>
        <p>{message}{status}</p>
        <p>A sua sessão mantém-se. Tente de novo dentro de momentos.</p>
        <Group gap="sm" mt="md">
          <Button onClick={onRetry}>Tentar de novo</Button>
        </Group>
      </Box>
    </Flex>
  )
}

export default PageBootError;
