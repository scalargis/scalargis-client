import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { Button } from '@mantine/core';
import { CollapsiblePanel, IconAngleUp, IconAngleDown, IconClock } from '@scalargis/ui';
import TimelineControl from './TimelineControl';
import { MainMenuButton } from '../../components';
import { timelineVisible, setTimelineVisible } from './visibility';
import { capabilitiesUrl, readTimeDimension } from './capabilities';
import { parseDimension, unionDimensions, restrictDimension } from './time';
export { default as configSchema } from './config.schema.json';

export function MainMenu({ className, config, record }) {
  const visible = timelineVisible(config.viewer, record);
  return <MainMenuButton className={className} active={visible} icon={<IconClock />}
    title={visible ? 'Ocultar Controlo Temporal' : 'Mostrar Controlo Temporal'}
    onClick={() => config.dispatch(setTimelineVisible(record.id, !visible))} />;
}

export default function Main({ as, core, config, utils, actions, record }) {
  const { mainMap, viewer, dispatch, Models } = config;
  const cfg = record.config_json || {};
  const visible = timelineVisible(viewer, record);
  const ds = cfg.datasource || {};
  const inline = useRef(null);
  const addedInlineId = useRef(null);
  const [opened, setOpened] = useState(true);
  const [dimensions, setDimensions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ids = [...new Set(ds.layer_ids?.length ? ds.layer_ids : [ds.layer_id, ...(ds.extra_layer_ids || [])].filter(Boolean))];
  const layers = viewer?.config_json?.layers || [];
  if (!ds.layer_ids?.length && ds.layer && viewer?.config_json?.layers) {
    const existing = layers.find(layer => layer.id === ds.layer_id);
    if (addedInlineId.current || !existing) {
      if (!inline.current) inline.current = { ...ds.layer, id: String(ds.layer.id ?? uuidV4()) };
      if (ds.layer_id) ids.splice(ids.indexOf(ds.layer_id), 1);
      if (!ids.includes(inline.current.id)) ids.unshift(inline.current.id);
    }
  }
  const checked = viewer?.config_json?.checked || [];
  const themes = ids.map(id => layers.find(layer => layer.id === id) || (inline.current?.id === id ? inline.current : null)).filter(Boolean);
  const anyVisible = themes.some(theme => checked.includes(theme.id));
  const sourcesKey = JSON.stringify(themes.map(({ id, type, url, version, layer, layers, dimensions, dimension_name }) => ({ id, type, url, version, layer, layers, dimensions, dimension_name })));
  const sources = useMemo(() => JSON.parse(sourcesKey), [sourcesKey]);
  const dimensionKey = cfg.dimension?.name;
  const authToken = core.getLoggedUser?.()?.auth_token;

  useEffect(() => {
    const theme = inline.current;
    if (!mainMap || !theme || addedInlineId.current || layers.some(layer => layer.id === theme.id)) return;
    addedInlineId.current = theme.id;
    dispatch(actions.viewer_add_themes(ds.parent_id || 'main', [theme], true));
    dispatch(actions.layers_set_checked([...new Set([...checked, theme.id])]));
  }, [mainMap, sourcesKey, layers, checked, actions, dispatch, ds.parent_id]);

  useEffect(() => {
    if (themes.length) setOpened(anyVisible);
  }, [anyVisible, themes.length]);

  useEffect(() => {
    if (!mainMap) return;
    let disposed = false;
    let pending = false;
    const controllers = new Set();
    setDimensions({});
    async function refresh() {
      if (pending) return;
      pending = true;
      setLoading(true);
      const requests = new Map();
      const results = await Promise.all(sources.map(async theme => {
        const name = theme.dimension_name || dimensionKey || 'time';
        const predefined = theme.dimensions?.find(d => d.name?.toLowerCase() === name.toLowerCase());
        if (predefined?.values) return [theme.id, parseDimension(predefined)];
        if (!theme.url) return [theme.id, null];
        const url = capabilitiesUrl(theme, core, {
          integrated_authentication: viewer.integrated_authentication,
          integrated_authentication_key: viewer.integrated_authentication_key,
        }, Models.Utils);
        if (!requests.has(url)) {
          requests.set(url, (async () => {
            const controller = new AbortController();
            controllers.add(controller);
            const seconds = Number(cfg.capabilitiesTimeout);
            const timeout = setTimeout(() => controller.abort(), (seconds > 0 && Number.isFinite(seconds) ? seconds : 10) * 1000);
            try {
              const response = await fetch(url, { signal: controller.signal });
              if (!response.ok) throw new Error('HTTP ' + response.status);
              return await response.text();
            } finally {
              clearTimeout(timeout);
              controllers.delete(controller);
            }
          })());
        }
        try {
          return [theme.id, parseDimension(readTimeDimension(await requests.get(url), theme, name))];
        } catch {
          return [theme.id, null];
        }
      }));
      if (!disposed) {
        setDimensions(previous => Object.fromEntries(results.map(([id, dim]) => [id, dim || previous[id] || null])));
        const failed = results.filter(([, dim]) => !dim).length;
        setError(failed ? `Não foi possível obter a dimensão temporal de ${failed} camada(s).` : '');
        setLoading(false);
      }
      pending = false;
    }
    refresh();
    const seconds = Number(cfg.refreshInterval);
    const timer = seconds > 0 && Number.isFinite(seconds) ? setInterval(refresh, seconds * 1000) : null;
    return () => {
      disposed = true;
      clearInterval(timer);
      controllers.forEach(controller => controller.abort());
    };
  }, [mainMap, sources, dimensionKey, cfg.refreshInterval, cfg.capabilitiesTimeout, authToken, core, Models.Utils, viewer.integrated_authentication, viewer.integrated_authentication_key]);

  const filterKey = JSON.stringify({ value: cfg.value, interval: cfg.interval, steps: cfg.steps, delta: cfg.delta });
  const dimension = useMemo(() => restrictDimension(unionDimensions(Object.values(dimensions)), JSON.parse(filterKey)), [dimensions, filterKey]);
  function toggle() {
    const next = !opened;
    setOpened(next);
    if (cfg.hideLayerOnCollapse === true) {
      dispatch(actions.layers_set_checked(next ? [...new Set([...checked, ...ids])] : checked.filter(id => !ids.includes(id))));
    }
  }
  const title = record.title || themes[0]?.title || 'Timeline';
  const content = <div style={{ background: 'var(--mantine-color-body)', padding: 8, borderRadius: 8, width: 'max-content', minWidth: 'min(274px, calc(100vw - 40px))', maxWidth: 'calc(100vw - 40px)' }}>
    <Button fullWidth size="xs" fz={14} h={32} rightSection={opened ? <IconAngleUp /> : <IconAngleDown />}
      title={opened ? 'Recolher Timeline' : 'Expandir Timeline'} aria-expanded={opened} onClick={toggle}>{title}</Button>
    <TimelineControl core={core} viewer={viewer} mainMap={mainMap} actions={actions} record={record}
      utils={utils} Models={Models} themes={themes} dimension={dimension} dimensions={dimensions}
      opened={opened} loading={loading} error={error} />
  </div>;
  return <div hidden={!visible} style={{ display: visible ? undefined : 'none' }}>
    {as === 'panel' ? <CollapsiblePanel header={cfg.header || title} toggleable={false}>{content}</CollapsiblePanel> : content}
  </div>;
}
