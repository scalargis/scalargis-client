import React from 'react';
import { Link } from 'react-router';
import { Anchor, Button, Group, Stack, Table, Text } from '@mantine/core';
import { Dialog, IconX } from '@scalargis/ui';

export const ERROR_TEXT = {
  invalid_code: 'O código só aceita letras minúsculas, algarismos e hífen.',
  duplicate_code: 'Já existe uma camada partilhada com este código.',
  invalid_layer: 'A camada tem de ser um objeto JSON com type e sem id.',
  group_layer: 'Uma camada partilhada não pode ser um GROUP.',
  in_use: 'A camada está em uso por visualizadores.'
};

/** Returns the Portuguese text of a refusal of the shared layer routes, or null. */
export const errorText = (e) => (e?.body?.error && ERROR_TEXT[e.body.error]) || null;

/** Table of the viewers that point to a shared layer, each linked to its edit page. */
export function UsageTable({ viewers }) {
  if (!viewers?.length) return <Text size="sm" c="dimmed">Nenhum visualizador usa esta camada.</Text>;
  return (
    <Table striped withTableBorder fz="sm" data-testid="shared-layer-usage">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Id</Table.Th>
          <Table.Th>Nome</Table.Th>
          <Table.Th>Título</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {viewers.map((v) => (
          <Table.Tr key={v.id}>
            <Table.Td>{v.id}</Table.Td>
            <Table.Td><Anchor component={Link} to={`/viewers/edit/${v.id}`}>{v.name}</Anchor></Table.Td>
            <Table.Td>{v.title}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

/** Dialog of a refused delete or code change: the viewers that still point to the layer. */
export function InUseDialog({ refusal, onClose }) {
  return (
    <Dialog
      title="Camada em uso"
      opened={!!refusal}
      onClose={onClose}
      size="50vw"
      footer={<Group justify="flex-end"><Button variant="default" leftSection={<IconX />} onClick={onClose}>Fechar</Button></Group>}
    >
      <Stack gap="sm" data-testid="shared-layer-in-use">
        <Text size="sm">{refusal?.text} Retire o ponteiro destes visualizadores primeiro.</Text>
        <UsageTable viewers={refusal?.viewers || []} />
      </Stack>
    </Dialog>
  );
}
