import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Autocomplete, Badge, Box, Button, Code, Group, Paper, Select, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { isEqual } from 'lodash';
import { JsonForm, coreComponentSchemas, viewerConfigSchema } from '@scalargis/components';
import { confirm, IconArrowDown, IconArrowUp, IconPlus, IconTrash } from '@scalargis/ui';

import { AJV_OPTIONS, FORM_CONFIG, FORM_I18N } from './formViewShared';
import {
  addComponent, componentForm, componentList, moveComponent, removeComponent, renameComponent, uniqueComponentId
} from './viewerComponents';

const CORE_TYPES = Object.keys(coreComponentSchemas).sort((a, b) => a.localeCompare(b));
const TARGETS = viewerConfigSchema.definitions.component.properties.target.examples || [];
const NEW_TARGET = 'mainmenu';

/** Returns the text title of a component record, or its id. */
function recordTitle(record) {
  const { title } = record;
  if (typeof title === 'string' && title) return title;
  if (title && typeof title === 'object') return title.pt || Object.values(title).find((v) => typeof v === 'string') || record.id;
  return record.id;
}

/** One row of the component list. */
function ComponentRow({ record, selected, onSelect }) {
  const known = !!coreComponentSchemas[record.type];
  return (
    <UnstyledButton
      type="button"
      onClick={() => onSelect(record.id)}
      data-testid="component-row"
      data-component-id={record.id}
      aria-pressed={selected}
      style={{
        display: 'block',
        width: '100%',
        padding: '4px 8px',
        background: selected ? 'var(--mantine-primary-color-light)' : undefined,
        borderRadius: 'var(--mantine-radius-sm)'
      }}
    >
      <Group gap={6} wrap="nowrap">
        <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>{recordTitle(record)}</Text>
        <Text size="xs" c="dimmed" truncate maw={120}>{record.target || '-'}</Text>
        <Badge size="xs" variant="light" color={known ? 'primary' : 'gray'}>{record.type || '?'}</Badge>
      </Group>
    </UnstyledButton>
  );
}

/** The Components section of the viewer form view: the component list, its actions, and the fields of the selected record. */
function ViewerComponentsSection({ config, readonly, dataGeneration, writeConfig, getLatest, selectedId, onSelect }) {
  const records = componentList(config);
  const selected = records.find((c) => c.id === selectedId) || null;
  const [newType, setNewType] = useState(null);

  useEffect(() => {
    if (selectedId && !selected) onSelect(null);
  }, [selectedId, selected]);

  const [idDraft, setIdDraft] = useState('');
  const [targetDraft, setTargetDraft] = useState('');
  useEffect(() => {
    setIdDraft(selectedId || '');
    setTargetDraft(selected?.target || '');
  }, [selectedId, dataGeneration]);

  const known = !!(selected && coreComponentSchemas[selected.type]);
  const formKey = useRef({ generation: null, id: null, type: null, form: null, data: null });
  if (formKey.current.generation !== dataGeneration || formKey.current.id !== selectedId
    || formKey.current.type !== selected?.type) {
    const data = selected?.config_json && typeof selected.config_json === 'object' ? selected.config_json : {};
    formKey.current = {
      generation: dataGeneration,
      id: selectedId,
      type: selected?.type,
      form: known ? componentForm(coreComponentSchemas[selected.type], data) : null,
      data
    };
  }
  const { form } = formKey.current;

  const apply = (change) => {
    const base = getLatest();
    if (!base) return;
    const next = change(base);
    if (next) writeConfig(next);
  };

  const add = () => {
    if (!newType) return;
    const type = newType;
    let id = null;
    apply((base) => {
      id = uniqueComponentId(base, type);
      const after = componentList(base).some((c) => c.id === selectedId) ? selectedId : null;
      return addComponent(base, { id, type, target: NEW_TARGET, config_json: {} }, after);
    });
    if (id) onSelect(id);
    setNewType(null);
  };

  const move = (step) => apply((base) => moveComponent(base, selectedId, step));

  const remove = () => {
    const record = selected;
    if (!record) return;
    confirm({
      header: 'Remover componente',
      severity: 'danger',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      message: `Remover o componente "${recordTitle(record)}" (${record.type})?`,
      accept: () => apply((base) => removeComponent(base, record.id))
    });
  };

  const idTrimmed = idDraft.trim();
  const idTaken = idTrimmed !== selectedId && records.some((c) => c.id === idTrimmed);
  const idError = !idTrimmed ? 'O id não pode ficar vazio.' : idTaken ? 'Outro componente já usa este id.' : null;
  const renameId = () => {
    if (idError || idTrimmed === selectedId) return;
    const newId = idTrimmed;
    apply((base) => renameComponent(base, selectedId, newId));
    onSelect(newId);
  };

  const setRecordKey = (key, value) => apply((base) => {
    const list = componentList(base);
    const record = list.find((c) => c.id === selectedId);
    if (!record || record[key] === value) return null;
    const next = { ...record };
    if (value === undefined || value === '') delete next[key];
    else next[key] = value;
    return { ...base, components: list.map((c) => (c.id === selectedId ? next : c)) };
  });

  const applyTarget = () => setRecordKey('target', targetDraft.trim() || undefined);

  const onConfigChange = ({ data }) => {
    if (!selectedId || readonly || !known) return;
    apply((base) => {
      const list = componentList(base);
      const record = list.find((c) => c.id === selectedId);
      if (!record) return null;
      const current = record.config_json && typeof record.config_json === 'object' ? record.config_json : {};
      const next = JSON.parse(JSON.stringify(data || {}));
      if (isEqual(next, current)) return null;
      return { ...base, components: list.map((c) => (c.id === selectedId ? { ...record, config_json: next } : c)) };
    });
  };

  const typeOptions = useMemo(() => CORE_TYPES.map((t) => ({ value: t, label: t })), []);
  const targetOptions = useMemo(() => [...new Set([...TARGETS, ...records.map((c) => c.target).filter(Boolean)])], [records]);
  const index = selected ? records.indexOf(selected) : -1;

  return (
    <Stack gap="sm" data-testid="form-view-components">
      <Group gap="xs" wrap="nowrap">
        <Select placeholder="Tipo de componente" data={typeOptions} value={newType} onChange={setNewType} searchable
          size="xs" disabled={readonly} style={{ flex: 1 }} data-testid="component-type" aria-label="Tipo de componente" />
        <Button type="button" size="xs" variant="light" leftSection={<IconPlus />} disabled={readonly || !newType}
          onClick={add} data-testid="component-add">Adicionar</Button>
        <Group gap={4} wrap="nowrap">
          <ActionIcon type="button" variant="subtle" disabled={readonly || index <= 0} onClick={() => move(-1)}
            aria-label="Subir" title="Subir" data-testid="component-up"><IconArrowUp /></ActionIcon>
          <ActionIcon type="button" variant="subtle" disabled={readonly || index < 0 || index >= records.length - 1}
            onClick={() => move(1)} aria-label="Descer" title="Descer" data-testid="component-down"><IconArrowDown /></ActionIcon>
          <ActionIcon type="button" variant="subtle" color="danger" disabled={readonly || !selected} onClick={remove}
            aria-label="Remover" title="Remover" data-testid="component-remove"><IconTrash /></ActionIcon>
        </Group>
      </Group>

      <Paper withBorder p={4} mah={360} style={{ overflowY: 'auto' }}>
        {records.length === 0 && <Text size="sm" c="dimmed" p="xs">Sem componentes.</Text>}
        {records.map((record) =>
          <ComponentRow key={record.id} record={record} selected={record.id === selectedId} onSelect={onSelect} />
        )}
      </Paper>

      {selected ?
        <Stack gap="xs" data-testid="component-fields">
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <TextInput label="Id" value={idDraft} onChange={(e) => setIdDraft(e.currentTarget.value)} error={idError}
              disabled={readonly} style={{ flex: 1 }} data-testid="component-id" />
            <Button type="button" size="sm" variant="default" disabled={readonly || !!idError || idTrimmed === selectedId}
              onClick={renameId} data-testid="component-id-apply">Mudar id</Button>
          </Group>
          <Autocomplete label="Zona" description="Zona do visualizador onde o componente aparece." data={targetOptions}
            value={targetDraft} onChange={setTargetDraft} onBlur={applyTarget} onOptionSubmit={(v) => setRecordKey('target', v)}
            disabled={readonly} data-testid="component-target" />
          <Text size="sm" fw={500}>Configuração do componente ({selected.type})</Text>
          {known && form &&
            <Box data-testid="component-config">
              <JsonForm
                key={`${selectedId}:${selected.type}:${dataGeneration}`}
                schema={form.schema}
                uischema={form.uischema}
                data={formKey.current.data}
                onChange={onConfigChange}
                ajvOptions={AJV_OPTIONS}
                config={FORM_CONFIG}
                i18n={FORM_I18N}
                readonly={readonly}
              />
            </Box>
          }
          {known && !form &&
            <Text size="sm" c="dimmed" data-testid="component-config-empty">
              O esquema deste tipo não tem campos para o formulário. Editar no separador Configuração.
            </Text>
          }
          {!known &&
            <Stack gap={4} data-testid="component-config-readonly">
              <Text size="sm" c="dimmed">Tipo sem esquema no formulário. Editar no separador Configuração.</Text>
              <Code block style={{ maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(selected.config_json ?? {}, null, 2)}</Code>
            </Stack>
          }
        </Stack> :
        <Text size="sm" c="dimmed">Escolha um componente da lista para ver os campos.</Text>
      }
    </Stack>
  );
}

export default ViewerComponentsSection;
