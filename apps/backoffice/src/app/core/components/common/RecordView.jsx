import React from 'react';
import { Alert, Box, Button, Group, LoadingOverlay } from '@mantine/core';
import { IconArrowLeft, IconRefresh } from '@scalargis/ui';

const loadErrorText = (error) => {
  if (error?.status === 404) return 'O registo não existe ou foi eliminado.';
  if (error?.status === 403) return 'Não tem permissão para ver este registo.';
  if (error?.status) return `O servidor respondeu com um erro (${error.status}).`;
  return 'Não foi possível contactar o servidor.';
};

/** Renders the loader, the load error with Voltar and Tentar de novo, or the children with the loaded record. */
export default function RecordView({ state, onBack, children }) {
  if (state.status === 'ready') return children(state.record);

  if (state.status === 'failed') {
    return (
      <Box p="xs">
        <Alert color="danger" py="xs" title="Não foi possível carregar o registo">
          {loadErrorText(state.error)}
        </Alert>
        <Group justify="flex-end" mt="xs" mb="md">
          <Button type="button" variant="default" leftSection={<IconArrowLeft />} onClick={onBack}>Voltar</Button>
          {state.error?.status !== 404 && state.error?.status !== 403 &&
            <Button type="button" leftSection={<IconRefresh />} onClick={state.reload}>Tentar de novo</Button>}
        </Group>
      </Box>
    );
  }

  return (
    <Box pos="relative" mih={160}>
      <LoadingOverlay visible />
    </Box>
  );
}
