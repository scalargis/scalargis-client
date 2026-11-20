import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import Main, { MainMenu } from './Main';
import { timelineVisible } from './visibility';
vi.mock('@mantine/core', () => ({
  Button: ({ children, onClick, disabled, title }) => <button onClick={onClick} disabled={disabled} title={title}>{children}</button>,
  Group: ({ children }) => <div>{children}</div>, Alert: ({ children }) => <div>{children}</div>, Text: ({ children }) => <span>{children}</span>,
  TextInput: React.forwardRef(({ value, defaultValue, onChange, onBlur, onFocus, onKeyDown, type, disabled, 'aria-label': label }, ref) => <input ref={ref} aria-label={label} type={type} value={value} defaultValue={defaultValue} onChange={onChange} onBlur={onBlur} onFocus={onFocus} onKeyDown={onKeyDown} disabled={disabled} />),
  Slider: () => <div />,
}));
vi.mock('@scalargis/ui', () => ({
  CollapsiblePanel: ({ children }) => <div>{children}</div>,
  IconAngleUp: () => null, IconAngleDown: () => null, IconClock: () => null,
  IconAngleDoubleLeft: () => null, IconAngleLeft: () => null, IconPause: () => null,
  IconPlay: () => null, IconAngleRight: () => null, IconAngleDoubleRight: () => null,
}));
vi.mock('../../components', () => {
  const Button = ({ title, onClick, disabled, active }) => <button aria-label={title} aria-pressed={active} onClick={onClick} disabled={disabled}>{title}</button>;
  Button.Group = ({ children }) => <div>{children}</div>;
  return { MainMenuButton: Button, MapToolButton: Button, Legend: () => null };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('uses each component default, ignores the removed global setting and preserves runtime choices', () => {
  const viewer = { config_json: { timeline_default_visible: false } };
  expect(timelineVisible(viewer, { id: 'omitted' })).toBe(true);
  expect(timelineVisible(viewer, { id: 'shown', config_json: { defaultVisible: true } })).toBe(true);
  expect(timelineVisible(viewer, { id: 'hidden', config_json: { defaultVisible: false } })).toBe(false);
  viewer.timelineVisibility = { shown: false, hidden: true };
  expect(timelineVisible(viewer, { id: 'shown', config_json: { defaultVisible: true } })).toBe(false);
  expect(timelineVisible(viewer, { id: 'hidden', config_json: { defaultVisible: false } })).toBe(true);
});
it('keeps TIME, selected date and playback alive while hidden, without switching menus', async () => {
  const layer = new TileLayer({ source: new TileWMS({ params: { LAYERS: 'test' } }) });
  const theme = { id: 'layer', title: 'Temporal', dimensions: [{ name: 'time', values: '2026-11-14T00:00Z/2026-11-14T23:00Z/PT10M' }] };
  const viewer = { config_json: { checked: [], layers: [theme], selected_menu: 'toc' } };
  const record = { id: 'timeline', title: 'Timeline', config_json: { defaultVisible: false, datasource: { layer_ids: ['layer'] }, selectedIndex: 'first', stepOptions: [{ value: 'PT10M', label: '10 min' }], speed: 1 } };
  const utils = { findOlLayer: () => layer };
  const config = { mainMap: {}, viewer, Models: { Utils: {} }, dispatch: vi.fn() };
  const core = {};
  const props = { core, config, record, utils, actions: {} };
  const view = render(<><MainMenu {...props} /><Main {...props} /></>);
  await waitFor(() => expect(layer.getSource().getParams().TIME).toBe('2026-11-14T00:00:00Z'));
  viewer.config_json.checked = ['layer'];
  view.rerender(<><MainMenu {...props} /><Main {...props} /></>);
  fireEvent.click(screen.getByLabelText('Mostrar Controlo Temporal'));
  expect(config.dispatch).toHaveBeenCalledWith({ type: 'TIMELINE_SET_WIDGET_VISIBLE', id: 'timeline', visible: true });
  viewer.timelineVisibility = { timeline: true };
  view.rerender(<><MainMenu {...props} /><Main {...props} /></>);
  fireEvent.click(screen.getByLabelText('Data seguinte'));
  expect(layer.getSource().getParams().TIME).toBe('2026-11-14T00:10:00Z');
  vi.useFakeTimers();
  fireEvent.click(screen.getByLabelText('Reproduzir'));
  viewer.timelineVisibility = { timeline: false };
  view.rerender(<><MainMenu {...props} /><Main {...props} /></>);
  expect(screen.getByLabelText('Data e hora local').closest('[hidden]')).not.toBeNull();
  act(() => vi.advanceTimersByTime(1000));
  expect(layer.getSource().getParams().TIME).toBe('2026-11-14T00:20:00Z');
  viewer.timelineVisibility = { timeline: true };
  view.rerender(<><MainMenu {...props} /><Main {...props} /></>);
  expect(screen.getByLabelText('Data e hora local').closest('[hidden]')).toBeNull();
  expect(layer.getSource().getParams().TIME).toBe('2026-11-14T00:20:00Z');
  expect(viewer.config_json.selected_menu).toBe('toc');
  fireEvent.click(screen.getByTitle('Recolher Timeline'));
  act(() => vi.advanceTimersByTime(2000));
  expect(layer.getSource().getParams().TIME).toBe('2026-11-14T00:20:00Z');
});

it('adds an inline layer only once while waiting for the viewer to register it', async () => {
  const viewer = { config_json: { checked: [], layers: [] } };
  const addTheme = vi.fn(() => ({ type: 'ADD' }));
  const props = {
    core: {}, utils: { findOlLayer: () => null },
    config: { mainMap: {}, viewer, Models: { Utils: {} }, dispatch: vi.fn() },
    actions: { viewer_add_themes: addTheme, layers_set_checked: vi.fn() },
    record: { id: 'timeline', config_json: { datasource: { layer: { title: 'Temporal' } } } },
  };
  const view = render(<React.StrictMode><Main {...props} /></React.StrictMode>);
  viewer.config_json.layers = [];
  await act(async () => view.rerender(<React.StrictMode><Main {...props} /></React.StrictMode>));
  expect(addTheme).toHaveBeenCalledTimes(1);
  expect(addTheme.mock.calls[0][1][0].id).toBeTruthy();
});
