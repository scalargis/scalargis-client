import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Group, Slider, Text } from '@mantine/core';
import { IconAngleDoubleLeft, IconAngleLeft, IconPause, IconPlay, IconAngleRight, IconAngleDoubleRight } from '@scalargis/ui';
import { Legend, MapToolButton } from '../../components';
import './timeline.css';
import DateInput from './DateInput';
import { applyLayerTime } from './layerTime';
import { durationSeconds, formatDate, initialDate, clampDate, selectDate, snapStepPeriod, stepDate, localInput, parseLocalInput } from './time';

export default function TimelineControl({ core, viewer, mainMap, actions, record, utils, Models, themes, dimension, dimensions, opened, loading, error }) {
  const cfg = record.config_json || {};
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [preview, setPreview] = useState(null);
  const hidden = useRef(new Map());
  const checked = viewer?.config_json?.checked || [];
  const anyVisible = themes.some(theme => checked.includes(theme.id));
  const options = (cfg.stepOptions || []).filter(option => durationSeconds(option.value) > 0);
  const step = activeStep || options[0]?.value || dimension?.step;
  const initialKey = JSON.stringify({ value: cfg.value, selectedIndex: cfg.selectedIndex });
  const layersKey = JSON.stringify((viewer?.config_json?.layers || []).map(layer => [layer.id, layer.children, layer.opacity]));
  const frameRate = Number(cfg.speed) > 0 && Number.isFinite(Number(cfg.speed)) ? Number(cfg.speed) : 0.5;

  useEffect(() => {
    setCurrent(previous => previous != null && dimension && previous >= dimension.min && previous <= dimension.max
      ? clampDate(previous, dimension) : initialDate(dimension, JSON.parse(initialKey), step));
    setPreview(null);
  }, [dimension, initialKey, step]);

  useEffect(() => { if (!opened || !anyVisible || !dimension) setPlaying(false); }, [opened, anyVisible, dimension]);

  useEffect(() => {
    if (!playing || !dimension) return;
    const timer = setInterval(() => {
      setCurrent(previous => {
        const next = stepDate(previous, dimension, step, 1);
        if (next === previous) {
          if (cfg.loop) return dimension.min;
          return previous;
        }
        return next;
      });
    }, Math.max(16, 1000 / frameRate));
    return () => clearInterval(timer);
  }, [playing, dimension, step, frameRate, cfg.loop]);

  useEffect(() => {
    if (playing && !cfg.loop && current === dimension?.max) setPlaying(false);
  }, [current, playing, cfg.loop, dimension?.max]);

  useEffect(() => {
    if (!mainMap || current == null) return;
    function apply() {
      for (const theme of themes) {
        const layer = utils.findOlLayer(mainMap, theme.id);
        if (!layer) continue;
        const extent = dimensions[theme.id];
        applyLayerTime(layer, theme, current, extent?.name || theme.dimension_name || cfg.dimension?.name || 'time', hidden.current);
      }
    }
    apply();
    // Re-resolve layers after the viewer replaces sources during TOC reordering.
    const timer = setTimeout(apply, 0);
    return () => clearTimeout(timer);
  }, [current, mainMap, layersKey, dimensions, themes, utils, cfg.dimension?.name]);

  useEffect(() => {
    const hiddenLayers = hidden.current;
    return () => {
      hiddenLayers.forEach((opacity, layer) => layer.setOpacity(opacity));
      hiddenLayers.clear();
    };
  }, []);

  if (!opened) return null;
  if (!anyVisible) return <Alert mt="xs" color="informative" p="xs" style={{ width: 258, maxWidth: '100%' }}>
    {themes.length ? <>
      <Text size="xs">Ative uma das seguintes camadas:</Text>
      <div role="region" aria-label="Camadas disponíveis no Controlo Temporal" tabIndex={0}
        style={{ maxHeight: 96, overflowY: 'auto', overflowWrap: 'anywhere', fontSize: 12 }}>
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
          {themes.map(theme => <li key={theme.id}>{theme.title || theme.name || theme.id}</li>)}
        </ul>
      </div>
    </> : <Text size="xs">Não existem camadas configuradas neste Controlo Temporal.</Text>}
  </Alert>;
  const enabled = current != null && !!dimension;
  const hasTime = step ? durationSeconds(step) < 86400 : !!dimension?.dates.some(value => value % 86400000);
  const display = preview ?? current;
  const inputValue = value => value == null ? '' : localInput(value, hasTime).slice(0, hasTime ? 16 : 10);
  const position = !enabled || dimension.max === dimension.min ? 0 : Math.round(((display - dimension.min) / (dimension.max - dimension.min)) * 1000);
  function select(value, dateOnly = false) {
    setPlaying(false);
    setCurrent(selectDate(value, dimension, step, dateOnly));
    setPreview(null);
  }
  function navigate(direction) {
    setPlaying(false);
    setCurrent(cfg.loop && direction > 0 && current === dimension.max
      ? dimension.min : stepDate(current, dimension, step, direction));
  }
  return <div style={{ padding: '6px 4px 2px' }}>
    {error && <details style={{ fontSize: 12, marginBottom: 6 }}><summary style={{ cursor: 'pointer' }}>Aviso sobre as datas das camadas</summary>{error}</details>}
    {!dimension && <Text size="sm" role="status">{loading ? 'A carregar datas…' : 'Sem datas disponíveis.'}</Text>}
    {cfg.showLegend === true && themes.filter(theme => checked.includes(theme.id)).map(theme =>
      <Legend key={theme.id} viewer={viewer} data={theme} core={core} actions={actions} models={Models} />)}
    <Group gap={6} wrap="wrap" justify="center" align="center">
    <DateInput key={hasTime ? 'datetime' : 'date'} size="xs" styles={{ input: { fontSize: 13, paddingInline: 6, height: 28, minHeight: 28 } }} className={`timeline-picker ${hasTime ? 'timeline-picker-time' : 'timeline-picker-date'}`} aria-label={hasTime ? 'Data e hora local' : 'Data local'} title="Hora local do navegador; serviços em UTC" type={hasTime ? 'datetime-local' : 'date'}
      value={inputValue(display)} min={inputValue(dimension?.min)} max={inputValue(dimension?.max)} step={hasTime ? 60 : 1}
      disabled={!enabled} onEdit={() => setPlaying(false)} onCommit={text => {
        const value = parseLocalInput(text, current);
        if (!Number.isFinite(value)) return null;
        const next = hasTime ? clampDate(value, dimension) : selectDate(value, dimension, step, true);
        setPlaying(false); setPreview(null); setCurrent(next);
        return inputValue(next);
      }} />
    {cfg.displayFormat && display != null && <Text size="xs" style={{ fontSize: 11, whiteSpace: 'nowrap' }} title="Hora local">{formatDate(display, cfg.displayFormat)}</Text>}
    </Group>
    <Slider mt={8} mb={12} size="xs" thumbSize={12} label={null} aria-label="Posição temporal" value={position} min={0} max={1000}
      disabled={!enabled || dimension.min === dimension.max}
      onChange={value => { setPlaying(false); setPreview(dimension.min + value / 1000 * (dimension.max - dimension.min)); }}
      onChangeEnd={value => select(dimension.min + value / 1000 * (dimension.max - dimension.min))} />
    {options.length > 0 && <Group justify="center" gap={6} mb={8}>
      {options.map(option => <Button key={option.value} size="compact-sm" fz={12} h={24} px={8} variant={step === option.value ? 'filled' : 'outline'}
        aria-pressed={step === option.value} disabled={!enabled} onClick={() => {
          setPlaying(false); setActiveStep(option.value); setCurrent(clampDate(snapStepPeriod(current, option.value), dimension));
        }}>{option.label || option.value}</Button>)}
    </Group>}
    <Group justify="center" gap={0} wrap="nowrap">
      <MapToolButton.Group>
        <MapToolButton size={30} radius="sm" icon={<IconAngleDoubleLeft />} title="Primeira data" disabled={!enabled} onClick={() => { setPlaying(false); setCurrent(dimension.min); }} />
        <MapToolButton size={30} radius="sm" icon={<IconAngleLeft />} title="Data anterior" disabled={!enabled} onClick={() => navigate(-1)} />
        <MapToolButton size={30} radius="sm" icon={playing ? <IconPause /> : <IconPlay />} title={playing ? 'Pausar' : 'Reproduzir'} disabled={!enabled || dimension.min === dimension.max}
          onClick={() => { if (!playing && current === dimension.max) setCurrent(dimension.min); setPlaying(!playing); }} />
        <MapToolButton size={30} radius="sm" icon={<IconAngleRight />} title="Data seguinte" disabled={!enabled} onClick={() => navigate(1)} />
        <MapToolButton size={30} radius="sm" icon={<IconAngleDoubleRight />} title="Última data" disabled={!enabled} onClick={() => { setPlaying(false); setCurrent(dimension.max); }} />
      </MapToolButton.Group>
    </Group>
  </div>;
}
