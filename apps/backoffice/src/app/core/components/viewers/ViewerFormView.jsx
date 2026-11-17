import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Accordion, ActionIcon, Alert, Box, Grid, Group, Paper, Text } from '@mantine/core';
import { isEqual } from 'lodash';
import { JsonForm, viewerConfigSchema } from '@scalargis/components';
import { IconAlertTriangle, IconRefresh } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import { AJV_OPTIONS, FORM_CONFIG, FORM_I18N, control, inlineRefs, pick } from './formViewShared';
import ViewerLayersSection from './ViewerLayersSection';

const PREVIEW_DELAY_MS = 800;

const MAP_KEYS = ['center', 'extent', 'full_extent', 'restricted_extent', 'constrained_extent',
  'display_crs', 'crs_list', 'map_controls', 'exclude_map_controls'];

const CRS_COLUMNS = ['srid', 'code', 'title', 'defs', 'precision'];
const MAP_CONTROL_COLUMNS = ['id', 'type', 'title', 'active', 'exclusive', 'show_button'];

/** Returns the schema of the Map section, cut from the viewer schema. */
function buildMapSchema() {
  const root = JSON.parse(JSON.stringify(viewerConfigSchema));
  const defs = {
    ...root.definitions,
    crs: { ...root.definitions.crs, properties: pick(root.definitions.crs.properties, CRS_COLUMNS) },
    mapControl: { ...root.definitions.mapControl, properties: pick(root.definitions.mapControl.properties, MAP_CONTROL_COLUMNS) }
  };
  return { type: 'object', properties: inlineRefs(pick(root.properties, MAP_KEYS), defs) };
}

const MAP_SCHEMA = buildMapSchema();

const MAP_UISCHEMA = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Group', label: 'Vista inicial e extensões', elements: ['center', 'extent', 'full_extent', 'restricted_extent', 'constrained_extent'].map(control) },
    { type: 'Group', label: 'Sistemas de coordenadas', elements: ['display_crs', 'crs_list'].map(control) },
    { type: 'Group', label: 'Controlos do mapa', elements: ['map_controls', 'exclude_map_controls'].map(control) }
  ]
};

/** Returns the parsed config text, or null when it is not a JSON object. */
function parseConfig(text) {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch (e) {
    return null;
  }
}

/** Returns the base URL of the viewer app that the preview frame opens. */
function previewBaseUrl(core) {
  const fromEnv = import.meta.env.VITE_APP_PREVIEW_VIEWER_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return window.location.origin + (core?.ROOT_PATH || '');
}

/** The beta form view of the viewer config: sections on the left, a preview of the unsaved config on the right. */
function ViewerFormView({ configText, onConfigTextChange, viewerId, active }) {
  const { core } = useContext(AppContext);

  const parsed = useMemo(() => parseConfig(configText), [configText]);
  const lastGood = useRef(parsed || {});
  if (parsed) lastGood.current = parsed;
  const config = parsed || lastGood.current;

  const latest = useRef(parsed);
  latest.current = parsed;

  const ownText = useRef(null);
  const seenText = useRef(null);
  const generation = useRef(0);
  const formInput = useRef(null);
  if (seenText.current !== configText || !formInput.current) {
    seenText.current = configText;
    if (ownText.current !== configText || !formInput.current) {
      ownText.current = null;
      generation.current += 1;
      formInput.current = pick(config, MAP_KEYS);
    }
  }
  const mapData = formInput.current;

  const writeConfig = (next) => {
    const text = JSON.stringify(next, null, 2);
    ownText.current = text;
    latest.current = next;
    onConfigTextChange(text);
  };

  const onMapChange = ({ data }) => {
    const base = latest.current;
    if (!base) return;
    const next = { ...base };
    for (const key of MAP_KEYS) {
      if (data?.[key] === undefined) delete next[key];
      else next[key] = data[key];
    }
    if (isEqual(pick(next, MAP_KEYS), pick(base, MAP_KEYS))) return;
    writeConfig(next);
  };

  const [frameOpened, setFrameOpened] = useState(false);
  useEffect(() => {
    if (active && viewerId) setFrameOpened(true);
  }, [active, viewerId]);

  const previewUrl = viewerId ? `${previewBaseUrl(core)}/preview/${encodeURIComponent(viewerId)}` : null;
  const previewOrigin = useMemo(() => (previewUrl ? new URL(previewUrl, window.location.href).origin : null), [previewUrl]);

  const frame = useRef(null);
  const ready = useRef(false);
  const lastSent = useRef(null);
  const [frameKey, setFrameKey] = useState(0);

  const reloadPreview = () => {
    ready.current = false;
    lastSent.current = null;
    setFrameKey((k) => k + 1);
  };

  const send = (value) => {
    const target = frame.current?.contentWindow;
    if (!target || !value) return;
    const text = JSON.stringify(value);
    if (text === lastSent.current) return;
    lastSent.current = text;
    target.postMessage({ type: 'sg-preview-config', config_json: value }, previewOrigin);
  };

  useEffect(() => {
    if (!frameOpened || !previewOrigin) return undefined;
    const onMessage = (event) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== previewOrigin) return;
      if (event.data?.type !== 'sg-preview-ready') return;
      ready.current = true;
      lastSent.current = null;
      send(latest.current);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frameOpened, previewOrigin]);

  useEffect(() => {
    if (!ready.current || !parsed) return undefined;
    const timer = setTimeout(() => send(parsed), PREVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [parsed]);

  return (
    <Grid gap="md">
      <Grid.Col span={{ base: 12, lg: 5 }}>
        {!parsed &&
          <Alert color="warning" mb="sm" icon={<IconAlertTriangle />} data-testid="form-view-invalid">
            JSON inválido no separador Configuração. O formulário fica só de leitura até o texto ser válido.
          </Alert>
        }
        <Accordion multiple defaultValue={['map', 'layers']} variant="separated">
          <Accordion.Item value="map">
            <Accordion.Control>Mapa</Accordion.Control>
            <Accordion.Panel>
              <Box data-testid="form-view-map">
                <JsonForm
                  schema={MAP_SCHEMA}
                  uischema={MAP_UISCHEMA}
                  data={mapData}
                  onChange={onMapChange}
                  ajvOptions={AJV_OPTIONS}
                  config={FORM_CONFIG}
                  i18n={FORM_I18N}
                  readonly={!parsed}
                />
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="layers">
            <Accordion.Control>Camadas</Accordion.Control>
            <Accordion.Panel>
              <ViewerLayersSection
                config={config}
                readonly={!parsed}
                dataGeneration={generation.current}
                writeConfig={writeConfig}
                getLatest={() => latest.current}
              />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Grid.Col>
      <Grid.Col span={{ base: 12, lg: 7 }}>
        <Paper withBorder style={{ overflow: 'hidden', position: 'sticky', top: 64 }}>
          <Group justify="space-between" px="sm" py={6}>
            <Text size="sm" fw={500}>Pré-visualização</Text>
            <Group gap="xs" wrap="nowrap">
              <Text size="xs" c="dimmed">Mostra o estado por gravar. Não grava.</Text>
              {frameOpened && previewUrl &&
                <ActionIcon type="button" variant="subtle" size="sm" onClick={reloadPreview}
                  aria-label="Recarregar a pré-visualização" title="Recarregar a pré-visualização">
                  <IconRefresh />
                </ActionIcon>
              }
            </Group>
          </Group>
          {previewUrl && frameOpened ?
            <iframe
              key={frameKey}
              ref={frame}
              src={previewUrl}
              title="Pré-visualização do visualizador"
              data-testid="form-view-preview"
              style={{ display: 'block', width: '100%', height: 'max(420px, calc(100vh - 140px))', border: 0 }}
            /> :
            <Text size="sm" c="dimmed" p="sm">
              {viewerId ? 'A pré-visualização abre com este separador.' : 'Grave o visualizador para ver a pré-visualização.'}
            </Text>
          }
        </Paper>
      </Grid.Col>
    </Grid>
  );
}

export default ViewerFormView;
