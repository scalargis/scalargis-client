import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Alert, Badge, Box, Button, Group, Paper, Select, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { JsonForm, viewerConfigSchema } from '@scalargis/components';
import { confirm, IconArrowDown, IconArrowUp, IconFolder, IconPlus, IconShare, IconTrash } from '@scalargis/ui';

import { AJV_OPTIONS, FORM_CONFIG, FORM_I18N, control, inlineRefs } from './formViewShared';
import {
  addNode, layerList, moveInto, moveNode, moveTargets, parentOf, removeNode, renameNode, rootIds, treeRows, uniqueId
} from './viewerLayerTree';
import SharedLayerPicker from './SharedLayerPicker';

const SIMPLE_TYPES = ['string', 'number', 'integer', 'boolean'];

const FORM_GROUPS = [
  { label: 'Base', keys: ['type', 'title', 'description'] },
  {
    label: 'Serviço', layerOnly: true,
    keys: ['url', 'layers', 'layer', 'version', 'servertype', 'format', 'get_map_format', 'get_feature_info_format', 'tiled',
      'styles', 'wms_style', 'wms_styles', 'crs_options', 'get_map_formats', 'get_feature_info_formats']
  },
  {
    label: 'Árvore e mapa',
    keys: ['active', 'opacity', 'open', 'exclusive', 'selectable', 'hidden', 'filtered', 'system', 'show_zoom_extent',
      'show_details', 'details_opened', 'toc_style', 'thumbnail']
  },
  { label: 'Legenda', layerOnly: true, keys: ['legend_url', 'legend_type', 'legend_label', 'legend_html'] },
  { label: 'Escalas', keys: ['min_scale', 'max_scale', 'min_resolution', 'max_resolution', 'source_min_scale', 'source_max_scale'] }
];

const TOP_LEVEL = '__top__';

/** Returns the schema of the layer form: the simple keys of a layer node, without id and children. */
function buildLayerSchema() {
  const root = JSON.parse(JSON.stringify(viewerConfigSchema));
  const layer = inlineRefs(root.definitions.layer, root.definitions);
  const properties = {};
  for (const [key, value] of Object.entries(layer.properties)) {
    if (key === 'id' || key === 'children' || key === 'shared') continue;
    if (SIMPLE_TYPES.includes(value.type)) properties[key] = value;
  }
  return { type: 'object', properties };
}

const LAYER_SCHEMA = buildLayerSchema();
const LAYER_KEYS = Object.keys(LAYER_SCHEMA.properties);

/** Returns the UI schema of the layer form for a node type. */
function layerUiSchema(isGroup) {
  const used = new Set();
  const elements = [];
  for (const group of FORM_GROUPS) {
    const keys = group.keys.filter((k) => LAYER_KEYS.includes(k));
    keys.forEach((k) => used.add(k));
    if (group.layerOnly && isGroup) continue;
    if (keys.length) elements.push({ type: 'Group', label: group.label, elements: keys.map(control) });
  }
  const rest = LAYER_KEYS.filter((k) => !used.has(k));
  if (rest.length && !isGroup) elements.push({ type: 'Group', label: 'Outros', elements: rest.map(control) });
  return { type: 'VerticalLayout', elements };
}

const GROUP_UISCHEMA = layerUiSchema(true);
const LAYER_UISCHEMA = layerUiSchema(false);

/** Returns the id of the first group that the top of the tree reaches, or the first group of the layers, or null. */
function firstGroupId(config) {
  const groups = layerList(config).filter((l) => l.type === 'GROUP');
  const top = rootIds(config).map((id) => groups.find((g) => g.id === id)).find(Boolean);
  return (top || groups[0])?.id ?? null;
}

/** Returns the form data of a node: its keys without id and children. */
function nodeFormData(node) {
  if (!node) return {};
  const { id, children, ...rest } = node;
  return rest;
}

/** One row of the layer tree. */
function TreeRow({ node, depth, parentId, selected, onSelect, library }) {
  const isGroup = node.type === 'GROUP';
  const shared = typeof node.shared === 'string' && node.shared ? node.shared : null;
  const entry = shared ? (library || []).find((r) => r.code === shared) : null;
  const title = node.title || entry?.title || node.id;
  const type = node.type || entry?.type;
  return (
    <UnstyledButton
      type="button"
      onClick={() => onSelect(node.id)}
      data-testid="layer-row"
      data-layer-id={node.id}
      data-depth={depth}
      data-parent-id={parentId || ''}
      data-shared={shared || undefined}
      aria-pressed={selected}
      style={{
        display: 'block',
        width: '100%',
        padding: `4px 8px 4px ${8 + depth * 18}px`,
        background: selected ? 'var(--mantine-primary-color-light)' : undefined,
        borderRadius: 'var(--mantine-radius-sm)'
      }}
    >
      <Group gap={6} wrap="nowrap">
        {isGroup && <IconFolder />}
        {shared && <IconShare />}
        <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>{title}</Text>
        <Text size="xs" c="dimmed" truncate maw={140}>{shared ? `partilhada: ${shared}` : node.id}</Text>
        <Badge size="xs" variant="light" color={isGroup ? 'gray' : shared && library && !entry ? 'warning' : 'primary'}>{type || '?'}</Badge>
      </Group>
    </UnstyledButton>
  );
}

/** The Layers section of the viewer form view: the layer tree, its actions, and the fields of the selected node. */
function ViewerLayersSection({ config, readonly, dataGeneration, writeConfig, getLatest, sharedLibrary }) {
  const { rows, orphans } = useMemo(() => treeRows(config), [config]);
  const [selectedId, setSelectedId] = useState(null);
  const nodes = layerList(config);
  const selected = nodes.find((l) => l.id === selectedId) || null;

  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selectedId, selected]);

  const [idDraft, setIdDraft] = useState('');
  useEffect(() => {
    setIdDraft(selectedId || '');
  }, [selectedId]);

  const formKey = useRef({ generation: null, id: null, type: null, data: null });
  if (formKey.current.generation !== dataGeneration || formKey.current.id !== selectedId
    || formKey.current.type !== selected?.type) {
    formKey.current = { generation: dataGeneration, id: selectedId, type: selected?.type, data: nodeFormData(selected) };
  }

  const apply = (change) => {
    const base = getLatest();
    if (!base) return;
    const next = change(base);
    if (next) writeConfig(next);
  };

  const addLayer = (isGroup) => apply((base) => {
    const id = uniqueId(base, isGroup ? 'grupo' : 'camada');
    const node = isGroup
      ? { id, type: 'GROUP', title: 'Novo grupo', children: [] }
      : { id, type: 'WMS', title: 'Nova camada', version: '1.3.0', format: 'image/png', opacity: 1 };
    const current = layerList(base).find((l) => l.id === selectedId);
    let parentId = null;
    let afterId = null;
    if (current?.type === 'GROUP') {
      parentId = current.id;
    } else if (current) {
      parentId = parentOf(base, current.id);
      afterId = current.id;
    }
    let next = base;
    if (!parentId && !isGroup) {
      parentId = firstGroupId(base);
      if (!parentId) {
        const group = { id: uniqueId(base, 'grupo'), type: 'GROUP', title: 'Novo grupo', children: [] };
        next = addNode(base, group, null);
        parentId = group.id;
      }
    }
    setSelectedId(id);
    return addNode(next, node, parentId, afterId);
  });

  const [pickerOpened, setPickerOpened] = useState(false);
  const pickerTarget = selected?.type === 'GROUP' ? selected.id : (selected ? parentOf(config, selected.id) : null);

  const move = (step) => apply((base) => moveNode(base, selectedId, step));

  const moveTo = (target) => {
    if (!target) return;
    apply((base) => moveInto(base, selectedId, target === TOP_LEVEL ? null : target));
  };

  const remove = () => {
    const node = selected;
    if (!node) return;
    const isGroup = node.type === 'GROUP' && Array.isArray(node.children) && node.children.length > 0;
    confirm({
      header: 'Remover nó',
      severity: 'danger',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      message: isGroup
        ? `Remover o grupo "${node.title || node.id}" e os nós dentro dele?`
        : `Remover "${node.title || node.id}"?`,
      accept: () => apply((base) => removeNode(base, node.id))
    });
  };

  const idTrimmed = idDraft.trim();
  const idTaken = idTrimmed !== selectedId && nodes.some((l) => l.id === idTrimmed);
  const idError = !idTrimmed ? 'O id não pode ficar vazio.' : idTaken ? 'Outro nó já usa este id.' : null;
  const renameId = () => {
    if (idError || idTrimmed === selectedId) return;
    const newId = idTrimmed;
    apply((base) => renameNode(base, selectedId, newId));
    setSelectedId(newId);
  };

  const onNodeChange = ({ data }) => {
    if (!selectedId || readonly) return;
    apply((base) => {
      const node = layerList(base).find((l) => l.id === selectedId);
      if (!node) return null;
      const merged = { ...node };
      for (const key of LAYER_KEYS) {
        if (data?.[key] === undefined) delete merged[key];
        else merged[key] = data[key];
      }
      for (const [key, value] of Object.entries(data || {})) {
        if (!LAYER_KEYS.includes(key) && key !== 'id' && key !== 'children') merged[key] = value;
      }
      if (JSON.stringify(merged) === JSON.stringify(node)) return null;
      return { ...base, layers: layerList(base).map((l) => (l.id === selectedId ? merged : l)) };
    });
  };

  const targets = selected ? moveTargets(config, selected.id) : [];
  const parentId = selected ? parentOf(config, selected.id) : null;
  const moveData = [
    ...(selected?.type === 'GROUP' ? [{ value: TOP_LEVEL, label: 'Topo da árvore' }] : []),
    ...targets.filter((g) => g.id !== parentId).map((g) => ({ value: g.id, label: `${g.title || g.id} (${g.id})` }))
  ];

  return (
    <Stack gap="sm" data-testid="form-view-layers">
      <Group gap="xs">
        <Button type="button" size="xs" variant="light" leftSection={<IconPlus />} disabled={readonly}
          onClick={() => addLayer(false)} data-testid="layer-add">Camada WMS</Button>
        <Button type="button" size="xs" variant="light" leftSection={<IconPlus />} disabled={readonly}
          onClick={() => addLayer(true)} data-testid="layer-add-group">Grupo</Button>
        {sharedLibrary !== undefined &&
          <Button type="button" size="xs" variant="light" leftSection={<IconPlus />} disabled={readonly || !sharedLibrary}
            onClick={() => setPickerOpened(true)} data-testid="layer-add-shared">Camada partilhada</Button>
        }
        <Group gap={4} ml="auto">
          <ActionIcon type="button" variant="subtle" disabled={readonly || !selected} onClick={() => move(-1)}
            aria-label="Subir" title="Subir" data-testid="layer-up"><IconArrowUp /></ActionIcon>
          <ActionIcon type="button" variant="subtle" disabled={readonly || !selected} onClick={() => move(1)}
            aria-label="Descer" title="Descer" data-testid="layer-down"><IconArrowDown /></ActionIcon>
          <ActionIcon type="button" variant="subtle" color="danger" disabled={readonly || !selected} onClick={remove}
            aria-label="Remover" title="Remover" data-testid="layer-remove"><IconTrash /></ActionIcon>
        </Group>
      </Group>

      <Paper withBorder p={4} mah={360} style={{ overflowY: 'auto' }}>
        {rows.length === 0 && orphans.length === 0 &&
          <Text size="sm" c="dimmed" p="xs">Sem camadas.</Text>
        }
        {rows.map(({ node, depth, parentId: rowParent }) =>
          <TreeRow key={node.id} node={node} depth={depth} parentId={rowParent} selected={node.id === selectedId} onSelect={setSelectedId} library={sharedLibrary} />
        )}
        {orphans.length > 0 &&
          <>
            <Text size="xs" c="dimmed" px="xs" pt="xs">Fora da árvore (nenhum grupo os tem)</Text>
            {orphans.map((node) =>
              <TreeRow key={node.id} node={node} depth={0} selected={node.id === selectedId} onSelect={setSelectedId} library={sharedLibrary} />
            )}
          </>
        }
      </Paper>

      {selected ?
        <Stack gap="xs" data-testid="layer-fields">
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <TextInput label="Id" value={idDraft} onChange={(e) => setIdDraft(e.currentTarget.value)} error={idError}
              disabled={readonly} style={{ flex: 1 }} data-testid="layer-id" />
            <Button type="button" size="sm" variant="default" disabled={readonly || !!idError || idTrimmed === selectedId}
              onClick={renameId} data-testid="layer-id-apply">Mudar id</Button>
          </Group>
          {typeof selected.shared === 'string' && selected.shared &&
            <Alert color="primary" py="xs" data-testid="layer-shared-note">
              Camada partilhada <b>{selected.shared}</b>. Os campos abaixo são as sobreposições deste visualizador. Um campo vazio
              usa o valor da biblioteca.
            </Alert>
          }
          <Select label="Mover para o grupo" placeholder="Escolha um grupo" data={moveData} value={null}
            onChange={moveTo} disabled={readonly} searchable data-testid="layer-move-into" />
          <Box>
            <JsonForm
              key={`${selectedId}:${selected.type === 'GROUP' ? 'g' : 'l'}`}
              schema={LAYER_SCHEMA}
              uischema={selected.type === 'GROUP' ? GROUP_UISCHEMA : LAYER_UISCHEMA}
              data={formKey.current.data}
              onChange={onNodeChange}
              ajvOptions={AJV_OPTIONS}
              config={FORM_CONFIG}
              i18n={FORM_I18N}
              readonly={readonly}
            />
          </Box>
        </Stack> :
        <Text size="sm" c="dimmed">Escolha um nó da árvore para ver os campos.</Text>
      }

      {sharedLibrary !== undefined &&
        <SharedLayerPicker
          opened={pickerOpened}
          onClose={() => setPickerOpened(false)}
          config={config}
          library={sharedLibrary}
          defaultTarget={pickerTarget}
          onAdd={(next, id) => { writeConfig(next); setSelectedId(id); }}
        />
      }
    </Stack>
  );
}

export default ViewerLayersSection;
