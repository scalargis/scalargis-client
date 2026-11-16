import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Box, Button, Group, Stack, Table, Text } from '@mantine/core';
import { MergeView } from '@codemirror/merge';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { Dialog, notify, IconAlertTriangle, IconCheck, IconEye, IconEyeSlash, IconRefresh, IconX } from '@scalargis/ui';

import { diffRecords, fieldOf, fieldText, formatValue, isLongField, parseJsonText } from './changes';

const MAX_ROWS = 200;

const readOnly = (isJson) => [
  lineNumbers(),
  EditorView.editable.of(false),
  EditorState.readOnly.of(true),
  EditorView.lineWrapping,
  ...(isJson ? [json()] : []),
];

/** Side-by-side view of the old and the new text of one field. */
function MergeDiff({ before, after }) {
  const parent = useRef(null);

  useEffect(() => {
    const isJson = [before, after].some((value) => {
      const parsed = parseJsonText(value);
      return parsed !== null && typeof parsed === 'object';
    });
    const view = new MergeView({
      a: { doc: fieldText(before), extensions: readOnly(isJson) },
      b: { doc: fieldText(after), extensions: readOnly(isJson) },
      parent: parent.current,
      collapseUnchanged: { margin: 3, minSize: 6 },
      gutter: true,
    });
    return () => view.destroy();
  }, [before, after]);

  return (
    <Box
      ref={parent}
      style={{
        maxHeight: '24rem',
        overflow: 'auto',
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-sm)',
        fontSize: 'var(--mantine-font-size-xs)',
      }}
    />
  );
}

const conflictText = (conflict) => {
  const when = conflict?.updated_at ? dayjs(conflict.updated_at).format('DD/MM/YYYY HH:mm') : null;
  const who = conflict?.user ? `Outro utilizador (${conflict.user})` : 'Outro utilizador';
  return `${who} gravou ${when ? `em ${when}` : 'este registo'}. Recarregue.`;
};

/** Dialog that lists the changes of a save and asks for a confirm. */
export function ChangeSummary({ opened, before, after, changes, saving, conflict, onConfirm, onCancel, onReload }) {
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (!opened) setShowDiff(false);
  }, [opened]);

  const fields = [...new Set(changes.map((c) => fieldOf(c.path)))];
  const longFields = fields.filter((field) => isLongField(before?.[field], after?.[field]));

  const footer = (
    <Group justify="flex-end">
      <Button variant="default" leftSection={<IconX />} onClick={onCancel} disabled={saving}>Cancelar</Button>
      {conflict ? (
        <Button leftSection={<IconRefresh />} onClick={onReload}>Recarregar</Button>
      ) : (
        <Button leftSection={<IconCheck />} onClick={onConfirm} loading={saving}>Confirmar</Button>
      )}
    </Group>
  );

  return (
    <Dialog title="Confirmar alterações" opened={opened} onClose={onCancel} size="60vw" footer={footer} maximizable>
      <Stack gap="sm">
        {conflict && (
          <Alert color="danger" icon={<IconAlertTriangle />} data-testid="change-summary-conflict">
            {conflictText(conflict)}
          </Alert>
        )}
        <Text size="sm">
          {changes.length === 1 ? '1 alteração' : `${changes.length} alterações`} em {fields.length === 1 ? '1 campo' : `${fields.length} campos`}.
        </Text>
        <Table striped withTableBorder fz="xs" data-testid="change-summary-list">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Campo</Table.Th>
              <Table.Th>Antes</Table.Th>
              <Table.Th>Depois</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {changes.slice(0, MAX_ROWS).map((change) => (
              <Table.Tr key={change.path}>
                <Table.Td ff="monospace" style={{ wordBreak: 'break-all' }}>{change.path}</Table.Td>
                <Table.Td style={{ wordBreak: 'break-all' }}>{formatValue(change.before)}</Table.Td>
                <Table.Td style={{ wordBreak: 'break-all' }}>{formatValue(change.after)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {changes.length > MAX_ROWS && (
          <Text size="xs" c="dimmed">Mais {changes.length - MAX_ROWS} alterações não listadas.</Text>
        )}
        {longFields.length > 0 && (
          <Group>
            <Button
              variant="default"
              size="xs"
              leftSection={showDiff ? <IconEyeSlash /> : <IconEye />}
              onClick={() => setShowDiff(!showDiff)}>
              {showDiff ? 'Esconder diferenças' : 'Ver diferenças'}
            </Button>
          </Group>
        )}
        {showDiff && longFields.map((field) => (
          <Stack key={field} gap={4}>
            <Text size="sm" fw={600} ff="monospace">{field}</Text>
            <MergeDiff before={before?.[field]} after={after?.[field]} />
          </Stack>
        ))}
      </Stack>
    </Dialog>
  );
}

/** Save of an existing record through the change summary, with the stale check of updated_at. */
export function useChangeSummary({ record, initialPayload, save, onSaved, onReload }) {
  const baseline = useRef(null);
  if (baseline.current === null) baseline.current = initialPayload();
  const updatedAt = useRef(record?.updated_at);
  const [state, setState] = useState({ opened: false, after: null, changes: [], conflict: null });
  const [saving, setSaving] = useState(false);

  const submit = (payload) => {
    const changes = diffRecords(baseline.current, payload);
    if (changes.length === 0) {
      notify.info('Gravar Registo', 'Sem alterações');
      return;
    }
    setState({ opened: true, after: payload, changes, conflict: null });
  };

  const close = () => setState((s) => ({ ...s, opened: false }));

  const confirm = () => {
    const payload = state.after;
    setSaving(true);
    save({ ...payload, updated_at: updatedAt.current ?? null })
      .then((response) => {
        updatedAt.current = response?.data?.updated_at ?? updatedAt.current;
        baseline.current = (onSaved && onSaved(response, payload)) || payload;
        notify.success('Editar Registo', 'Registo alterado com sucesso');
        close();
      })
      .catch((e) => {
        if (e?.status === 409) {
          setState((s) => ({ ...s, conflict: e.body || {} }));
        } else {
          notify.error('Editar Registo', 'Ocorreu um erro ao alterar o registo');
        }
      })
      .finally(() => setSaving(false));
  };

  const reload = () => {
    close();
    if (onReload) onReload();
  };

  const dialog = (
    <ChangeSummary
      opened={state.opened}
      before={baseline.current}
      after={state.after}
      changes={state.changes}
      saving={saving}
      conflict={state.conflict}
      onConfirm={confirm}
      onCancel={close}
      onReload={reload}
    />
  );

  return { submit, saving, dialog };
}
