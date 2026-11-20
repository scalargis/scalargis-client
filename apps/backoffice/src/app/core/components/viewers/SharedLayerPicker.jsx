import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Group, Paper, Radio, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { Dialog, IconCheck, IconSearch, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { addSharedPointer, layerList } from './viewerLayerTree';

const TOP_LEVEL = '__top__';

/** Loads the shared layer library for an admin. Returns the rows, or null while it loads, when it fails, or for a non-admin. */
export function useSharedLibrary(enabled) {
  const { core } = useContext(AppContext);
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    dataProvider(core.API_URL + '/portal')
      .getList('shared-layers', { pagination: { page: 1, perPage: 1000 }, sort: { field: 'code', order: 'ASC' }, filter: {} })
      .then((r) => { if (live) setRows(r.data || []); })
      .catch(() => { if (live) setRows(null); });
    return () => { live = false; };
  }, [enabled, core.API_URL]);
  return rows;
}

/** Returns the codes that the config names and the library does not hold. */
export function unknownSharedCodes(codes, library) {
  if (!library) return [];
  const known = new Set(library.map((r) => r.code));
  return codes.filter((c) => !known.has(c));
}

/** Dialog "Adicionar camada partilhada": picks a library layer and a target group, then adds a pointer to the config. */
function SharedLayerPicker({ opened, onClose, config, library, defaultTarget, onAdd }) {
  const [query, setQuery] = useState('');
  const [code, setCode] = useState(null);
  const [target, setTarget] = useState(TOP_LEVEL);

  const groups = useMemo(() => layerList(config).filter((l) => l.type === 'GROUP'), [config]);

  useEffect(() => {
    if (!opened) return;
    setQuery('');
    setCode(null);
    const fallback = groups.some((g) => g.id === 'main') ? 'main' : TOP_LEVEL;
    setTarget(defaultTarget && groups.some((g) => g.id === defaultTarget) ? defaultTarget : fallback);
  }, [opened]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (library || []).filter((r) => !q
      || (r.code || '').toLowerCase().includes(q)
      || (r.title || '').toLowerCase().includes(q)
      || (r.type || '').toLowerCase().includes(q));
  }, [library, query]);

  const targetData = [
    { value: TOP_LEVEL, label: 'Topo da árvore' },
    ...groups.map((g) => ({ value: g.id, label: `${g.title || g.id} (${g.id})` }))
  ];

  const add = () => {
    if (!code) return;
    const result = addSharedPointer(config, code, target === TOP_LEVEL ? null : target);
    onAdd(result.config, result.id);
    onClose();
  };

  return (
    <Dialog
      title="Adicionar camada partilhada"
      opened={opened}
      onClose={onClose}
      size="50vw"
      footer={
        <Group justify="flex-end">
          <Button variant="default" leftSection={<IconX />} onClick={onClose}>Cancelar</Button>
          <Button leftSection={<IconCheck />} disabled={!code} onClick={add} data-testid="shared-picker-add">Adicionar</Button>
        </Group>
      }
    >
      <Stack gap="sm" data-testid="shared-picker">
        <TextInput
          placeholder="Pesquisar código, título ou tipo"
          leftSection={<IconSearch />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          data-testid="shared-picker-search"
        />
        <Paper withBorder mah={320} style={{ overflowY: 'auto' }}>
          {library === null ?
            <Text size="sm" c="dimmed" p="xs">Não foi possível ler a biblioteca.</Text> :
            rows.length === 0 ?
              <Text size="sm" c="dimmed" p="xs">Nenhuma camada partilhada.</Text> :
              <Table highlightOnHover fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={36} />
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Título</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((r) => (
                    <Table.Tr key={r.id} onClick={() => setCode(r.code)} style={{ cursor: 'pointer' }}
                      bg={r.code === code ? 'var(--mantine-primary-color-light)' : undefined}
                      data-testid="shared-picker-row" data-code={r.code}>
                      <Table.Td><Radio size="xs" checked={r.code === code} onChange={() => setCode(r.code)} aria-label={r.code} /></Table.Td>
                      <Table.Td>{r.code}</Table.Td>
                      <Table.Td>{r.title}</Table.Td>
                      <Table.Td><Badge size="xs" variant="light">{r.type || '?'}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
          }
        </Paper>
        <Select label="Adicionar em" data={targetData} value={target} onChange={(v) => v && setTarget(v)}
          allowDeselect={false} searchable data-testid="shared-picker-target" />
        <Text size="xs" c="dimmed">A camada entra desligada. O visualizador recebe a versão atual da biblioteca em cada carregamento.</Text>
      </Stack>
    </Dialog>
  );
}

export default SharedLayerPicker;
