import React, { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Group, Loader, Table, Text } from '@mantine/core';
import { Dialog, notify, IconEye, IconHistory, IconInfoCircle, IconUndo } from '@scalargis/ui';

import { fetchJson } from '../../../service/fetch';
import { ChangeSummary } from './ChangeSummary';
import { diffRecords } from './changes';

const ORIGINS = { backoffice: 'Backoffice', visualizador: 'Visualizador' };

const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '');

/** Table of the saved states of one record, newest first. */
function RecordHistoryTable({ url, reloadKey, onView, onRestore, busy }) {
  const [state, setState] = useState({ status: 'loading', rows: [] });
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    setState((s) => ({ ...s, status: 'loading' }));
    fetchJson(url)
      .then(({ json }) => { if (id === request.current) setState({ status: 'ready', rows: json || [] }); })
      .catch(() => { if (id === request.current) setState({ status: 'failed', rows: [] }); });
  }, [url, reloadKey]);

  if (state.status === 'loading' && state.rows.length === 0) return <Loader size="sm" />;
  if (state.status === 'failed') return <Alert color="danger">Não foi possível carregar o histórico.</Alert>;
  if (state.rows.length === 0) return <Text size="sm" c="dimmed">Sem estados anteriores.</Text>;

  return (
    <Table striped withTableBorder fz="sm" data-testid="record-history">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Data</Table.Th>
          <Table.Th>Utilizador</Table.Th>
          <Table.Th>Origem</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {state.rows.map((row) => (
          <Table.Tr key={row.id}>
            <Table.Td>{formatDate(row.date)}</Table.Td>
            <Table.Td>{row.user || ''}</Table.Td>
            <Table.Td>{ORIGINS[row.origin] || row.origin}</Table.Td>
            <Table.Td>
              <Group gap="xs" justify="flex-end" wrap="nowrap">
                <Button size="xs" variant="default" leftSection={<IconEye />} disabled={busy} onClick={() => onView(row)}>Ver</Button>
                <Button size="xs" variant="default" leftSection={<IconUndo />} disabled={busy} onClick={() => onRestore(row)}>Restaurar</Button>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

/** History of a record: the table, the read-mode compare, the restore into the form, and the notice after a restore. */
export function useRecordHistory({ url, savedCount, current, fromSnapshot, onRestore }) {
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => { setRestored(null); }, [savedCount]);

  const load = useCallback((row) => {
    setBusy(true);
    return fetchJson(`${url}/${row.id}`)
      .then(({ json }) => ({ row, payload: fromSnapshot(json.snapshot || {}) }))
      .catch(() => {
        notify.error('Histórico', 'Não foi possível carregar o estado');
        return null;
      })
      .finally(() => setBusy(false));
  }, [url, fromSnapshot]);

  const restore = (item) => {
    onRestore(item.payload);
    setRestored(item.row);
    setView(null);
    setModalOpened(false);
  };

  const openView = (row) => load(row).then((item) => {
    if (!item) return;
    const form = current();
    if (!form) return;
    setView({ ...item, form, changes: diffRecords(item.payload, form) });
  });

  const openRestore = (row) => load(row).then((item) => { if (item) restore(item); });

  const table = url ? (
    <RecordHistoryTable url={url} reloadKey={savedCount} busy={busy} onView={openView} onRestore={openRestore} />
  ) : null;

  const dialog = (
    <ChangeSummary
      readMode
      opened={!!view}
      title={view ? `Estado de ${formatDate(view.row.date)}` : ''}
      before={view?.payload}
      after={view?.form}
      changes={view?.changes || []}
      onCancel={() => setView(null)}
      onRestore={() => restore(view)}
    />
  );

  const notice = restored ? (
    <Alert color="informative" icon={<IconInfoCircle />} mb="sm" data-testid="record-history-restored">
      Estado de {formatDate(restored.date)} reposto. Gravar para aplicar.
    </Alert>
  ) : null;

  const button = url ? (
    <Button type="button" variant="default" leftSection={<IconHistory />} onClick={() => setModalOpened(true)}>Histórico</Button>
  ) : null;

  const modal = url ? (
    <Dialog title="Histórico" opened={modalOpened} onClose={() => setModalOpened(false)} size="50vw">
      {modalOpened && table}
    </Dialog>
  ) : null;

  return { table, dialog, notice, button, modal };
}
