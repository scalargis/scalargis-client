import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import Main from './Main';

let search = '';
vi.mock('react-router', () => ({ useLocation: () => ({ search }) }));

const WMS = 'type=wms&url=https://geo.example.com/wms&layers=ws:parcels';

const run = (query) => {
  search = `?${query}`;
  const dispatch = vi.fn();
  const actions = {
    viewer_add_themes: (parent, themes) => ({ type: 'ADD_THEMES', themes }),
    layers_set_checked: (checked) => ({ type: 'SET_CHECKED', checked }),
    map_set_extent: vi.fn()
  };
  const config = {
    dispatch,
    mainMap: {},
    viewer: { loaded: true, config_json: { checked: [] } },
    Models: { MapModel: { transformExtent: vi.fn() } }
  };
  render(<Main config={config} actions={actions} />);
  const added = dispatch.mock.calls.map(([a]) => a).find(a => a.type === 'ADD_THEMES');
  const checked = dispatch.mock.calls.map(([a]) => a).find(a => a.type === 'SET_CHECKED');
  return { theme: added.themes[0], checked: checked.checked };
};

describe('URLlayers', () => {
  it('uses the themeId parameter as the layer id', () => {
    const { theme, checked } = run(`${WMS}&themeId=parcels-link`);
    expect(theme.id).toBe('parcels-link');
    expect(checked).toEqual(['parcels-link']);
  });

  it('gives the same id on a second open of the same link', () => {
    expect(run(`${WMS}&themeId=parcels-link`).theme.id).toBe(run(`${WMS}&themeId=parcels-link`).theme.id);
  });

  it('falls back to a random id with no themeId parameter', () => {
    const first = run(WMS).theme.id;
    const second = run(WMS).theme.id;
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(first).not.toBe(second);
  });
});
